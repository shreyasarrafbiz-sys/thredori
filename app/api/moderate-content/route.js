import { NextResponse } from "next/server";

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

  if (status === 401) {
    return "Content verification is not authorized. Check OPENAI_API_KEY in Vercel.";
  }

  if (
    code === "credit_balance_exhausted" ||
    code === "organization_usage_limit_exceeded" ||
    code === "organization_spend_limit_exceeded" ||
    code === "project_spend_limit_exceeded"
  ) {
    return "OpenAI API access is currently limited by the API account or project limits. Check the OpenAI API Limits and Billing pages.";
  }

  if (status === 429) {
    return "Content verification is temporarily rate-limited. The server retried once. Please wait a moment and try again.";
  }

  if (status === 400) {
    return error.message
      ? `The verification request was rejected: ${error.message}`
      : "The image could not be submitted for verification.";
  }

  if (status >= 500) {
    return "The content verification service is temporarily unavailable. Please try again.";
  }

  return "We could not verify this post. Please try again.";
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { allowed: false, reason: "Content moderation is not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const text = [body.brandName, body.note, body.title, body.body]
      .filter(Boolean)
      .join("\n")
      .trim();
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";

    if (!text && !imageDataUrl) {
      return NextResponse.json({ allowed: true });
    }

    const input = [];
    if (text) input.push({ type: "text", text });
    if (imageDataUrl) {
      input.push({ type: "image_url", image_url: { url: imageDataUrl } });
    }

    let moderationResponse = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input,
        }),
      });

      if (moderationResponse.ok || moderationResponse.status !== 429 || attempt === MAX_RETRIES) {
        break;
      }

      await sleep(getRetryDelay(moderationResponse, attempt));
    }

    if (!moderationResponse.ok) {
      const raw = await moderationResponse.text();
      const openAIError = parseOpenAIError(raw);

      console.error("OpenAI moderation error", {
        status: moderationResponse.status,
        type: openAIError.type,
        code: openAIError.code,
        message: openAIError.message,
        requestId: moderationResponse.headers.get("x-request-id"),
        rateLimitRequests: moderationResponse.headers.get("x-ratelimit-limit-requests"),
        remainingRequests: moderationResponse.headers.get("x-ratelimit-remaining-requests"),
        resetRequests: moderationResponse.headers.get("x-ratelimit-reset-requests"),
        rateLimitTokens: moderationResponse.headers.get("x-ratelimit-limit-tokens"),
        remainingTokens: moderationResponse.headers.get("x-ratelimit-remaining-tokens"),
        resetTokens: moderationResponse.headers.get("x-ratelimit-reset-tokens"),
      });

      return NextResponse.json(
        {
          allowed: false,
          reason: getFriendlyError(moderationResponse.status, openAIError),
          errorCode: openAIError.code || openAIError.type || `http_${moderationResponse.status}`,
          errorMessage: openAIError.message || null,
          retryAfter: moderationResponse.headers.get("retry-after"),
        },
        { status: moderationResponse.status === 429 ? 429 : 502 }
      );
    }

    const result = await moderationResponse.json();
    const moderation = result?.results?.[0];
    const categories = moderation?.categories || {};
    const blockedCategory = BLOCKED_CATEGORIES.find(
      (category) => categories[category] === true
    );

    if (blockedCategory || moderation?.flagged) {
      return NextResponse.json({
        allowed: false,
        reason: "This post contains content that is not allowed on Thredori.",
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error("Content moderation failed", error);
    return NextResponse.json(
      { allowed: false, reason: "We could not verify this post. Please try again." },
      { status: 500 }
    );
  }
}
