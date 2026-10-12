import { NextResponse } from "next/server";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { runSafeSearch } from "../../../lib/server/safeSearch";

export const runtime = "nodejs";

const BLOCKED_CATEGORIES = [
  "sexual",
  "sexual/minors",
  "violence",
  "violence/graphic",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
  "hate",
  "hate/threatening",
  "harassment",
  "harassment/threatening",
  "illicit",
  "illicit/violent",
];

const MAX_RETRIES = 1;
const BASE_RETRY_DELAY_MS = 1500;
let visionClient;

function getVisionClient() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Vision credentials are not configured");
  }

  if (!visionClient) {
    visionClient = new ImageAnnotatorClient({
      projectId,
      credentials: { client_email: clientEmail, private_key: privateKey },
    });
  }
  return visionClient;
}

async function detectSafeSearch(buffer) {
  const client = getVisionClient();
  const [result] = await client.safeSearchDetection({ image: { content: buffer } });
  if (result?.error?.message || !result?.safeSearchAnnotation) {
    throw new Error("SafeSearch did not return an annotation");
  }
  return result.safeSearchAnnotation;
}

function getRetryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, 15000);
  }
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOpenAIError(raw) {
  try {
    const parsed = JSON.parse(raw);
    return {
      type: parsed?.error?.type || "",
      code: parsed?.error?.code || "",
      message: parsed?.error?.message || "",
    };
  } catch {
    return { type: "", code: "", message: "" };
  }
}

function getFriendlyError(status, error) {
  const code = error.code || error.type;
  if (status === 401) return "Content verification is not authorized. Check OPENAI_API_KEY in Vercel.";
  if (["credit_balance_exhausted", "organization_usage_limit_exceeded", "organization_spend_limit_exceeded", "project_spend_limit_exceeded"].includes(code)) {
    return "OpenAI API access is currently limited by the API account or project limits. Check the OpenAI API Limits and Billing pages.";
  }
  if (status === 429) {
    return `Content verification is temporarily rate-limited. Code: ${code || "rate_limit_exceeded"}. Please try again in a moment.`;
  }
  if (status === 400) return error.message ? `The verification request was rejected: ${error.message}` : "The image could not be submitted for verification.";
  if (status >= 500) return "The content verification service is temporarily unavailable. Please try again.";
  return "We could not verify this post. Please try again.";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ allowed: false, reason: "Invalid moderation request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ allowed: false, reason: "Invalid moderation request." }, { status: 400 });
  }

  const imageDataUrl = body.imageDataUrl;
  const text = [body.brandName, body.note, body.title, body.body]
    .filter((value) => typeof value === "string")
    .join("\n")
    .trim();

  if (typeof imageDataUrl !== "string" || !imageDataUrl) {
    return NextResponse.json({ allowed: false, reason: "An image is required for moderation." }, { status: 400 });
  }

  // SafeSearch is a required gate. A provider/configuration failure fails closed.
  const safeSearch = await runSafeSearch(imageDataUrl, detectSafeSearch);
  if (!safeSearch.allowed) {
    if (safeSearch.serviceError) {
      console.error("Google Vision SafeSearch unavailable; image blocked.");
      return NextResponse.json({
        allowed: false,
        reason: safeSearch.reason,
        errorCode: "vision_unavailable",
      }, { status: 503 });
    }

    return NextResponse.json({
      allowed: false,
      reviewRequired: safeSearch.reviewRequired === true,
      reason: safeSearch.reason,
      ...(safeSearch.signals ? { safeSearch: safeSearch.signals } : {}),
    }, { status: 200 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { allowed: false, reason: "Content moderation is not configured yet." },
      { status: 503 }
    );
  }

  const input = [];
  if (text) input.push({ type: "text", text });
  input.push({ type: "image_url", image_url: { url: imageDataUrl } });

  let moderationResponse = null;
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input }),
      });

      if (moderationResponse.ok || moderationResponse.status !== 429 || attempt === MAX_RETRIES) break;
      await sleep(getRetryDelay(moderationResponse, attempt));
    }
  } catch {
    console.error("OpenAI moderation request failed.");
    return NextResponse.json({ allowed: false, reason: "Content verification is temporarily unavailable. Please try again." }, { status: 502 });
  }

  if (!moderationResponse?.ok) {
    const raw = await moderationResponse.text();
    const openAIError = parseOpenAIError(raw);
    // Log provider metadata only. Never log image data or credentials.
    console.error("OpenAI moderation error", {
      status: moderationResponse.status,
      type: openAIError.type,
      code: openAIError.code,
      requestId: moderationResponse.headers.get("x-request-id"),
    });

    return NextResponse.json(
      {
        allowed: false,
        reason: getFriendlyError(moderationResponse.status, openAIError),
        errorCode: openAIError.code || openAIError.type || `http_${moderationResponse.status}`,
      },
      { status: moderationResponse.status === 429 ? 429 : 502 }
    );
  }

  try {
    const result = await moderationResponse.json();
    const moderation = result?.results?.[0];
    const categories = moderation?.categories || {};
    const blockedCategory = BLOCKED_CATEGORIES.find((category) => categories[category] === true);

    if (!moderation || blockedCategory || moderation.flagged) {
      return NextResponse.json({
        allowed: false,
        reason: "This post contains content that is not allowed on Thredori.",
      });
    }

    return NextResponse.json({ allowed: true });
  } catch {
    return NextResponse.json({ allowed: false, reason: "Content verification returned an invalid response." }, { status: 502 });
  }
}
