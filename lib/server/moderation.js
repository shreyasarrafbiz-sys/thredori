import { ImageAnnotatorClient } from "@google-cloud/vision";
import { runSafeSearch } from "./safeSearch";

const BLOCKED_CATEGORIES = [
  "sexual", "sexual/minors", "violence", "violence/graphic",
  "self-harm", "self-harm/intent", "self-harm/instructions",
  "hate", "hate/threatening", "harassment", "harassment/threatening",
  "illicit", "illicit/violent",
];

let visionClient;
function getVisionClient() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Vision credentials are not configured");
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient({
      projectId,
      credentials: { client_email: clientEmail, private_key: privateKey },
    });
  }
  return visionClient;
}

async function detectSafeSearch(buffer) {
  const [result] = await getVisionClient().safeSearchDetection({ content: buffer });
  if (result?.error?.message || !result?.safeSearchAnnotation) throw new Error("SafeSearch did not return an annotation");
  return result.safeSearchAnnotation;
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  return Number.isFinite(retryAfter) && retryAfter >= 0
    ? Math.min(retryAfter * 1000, 15000)
    : 1500 * Math.pow(2, attempt);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseOpenAIError(raw) {
  try {
    const parsed = JSON.parse(raw);
    return { type: parsed?.error?.type || "", code: parsed?.error?.code || "", message: parsed?.error?.message || "" };
  } catch {
    return { type: "", code: "", message: "" };
  }
}

function friendlyOpenAIError(status, error) {
  const code = error.code || error.type;
  if (status === 401) return "Content verification is not authorized. Check OPENAI_API_KEY in Vercel.";
  if (["credit_balance_exhausted", "organization_usage_limit_exceeded", "organization_spend_limit_exceeded", "project_spend_limit_exceeded"].includes(code)) {
    return "OpenAI API access is currently limited by account or project limits.";
  }
  if (status === 429) return "Content verification is temporarily rate-limited. Please try again in a moment.";
  if (status >= 500) return "The content verification service is temporarily unavailable. Please try again.";
  return "We could not verify this image. Please try again.";
}

/** SafeSearch and existing OpenAI moderation must both pass before publication. */
export async function moderateImage(imageDataUrl, text = "") {
  const safe = await runSafeSearch(imageDataUrl, detectSafeSearch);
  if (!safe.allowed) return {
    allowed: false,
    reviewRequired: safe.reviewRequired === true,
    serviceError: safe.serviceError === true,
    status: safe.serviceError ? 503 : 200,
    reason: safe.reason,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { allowed: false, status: 503, reason: "Content moderation is not configured yet." };

  const input = [];
  if (text.trim()) input.push({ type: "text", text: text.trim() });
  input.push({ type: "image_url", image_url: { url: imageDataUrl } });

  let response;
  try {
    for (let attempt = 0; attempt <= 1; attempt += 1) {
      response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "omni-moderation-latest", input }),
      });
      if (response.ok || response.status !== 429 || attempt === 1) break;
      await sleep(retryDelay(response, attempt));
    }
  } catch {
    console.error("OpenAI moderation request failed.");
    return { allowed: false, status: 502, reason: "Content verification is temporarily unavailable. Please try again." };
  }

  if (!response?.ok) {
    const error = parseOpenAIError(await response.text());
    console.error("OpenAI moderation error", { status: response.status, type: error.type, code: error.code, requestId: response.headers.get("x-request-id") });
    return { allowed: false, status: response.status === 429 ? 429 : 502, reason: friendlyOpenAIError(response.status, error) };
  }

  try {
    const moderation = (await response.json())?.results?.[0];
    if (!moderation || moderation.flagged || BLOCKED_CATEGORIES.some((category) => moderation.categories?.[category] === true)) {
      return { allowed: false, status: 200, reason: "This image or its accompanying text contains content that is not allowed on Thredori." };
    }
    return { allowed: true, status: 200 };
  } catch {
    return { allowed: false, status: 502, reason: "Content verification returned an invalid response." };
  }
}
