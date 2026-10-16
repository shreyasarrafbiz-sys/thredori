const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i;
const LIKELIHOOD_RANK = {
  VERY_UNLIKELY: 0,
  UNLIKELY: 1,
  POSSIBLE: 2,
  LIKELY: 3,
  VERY_LIKELY: 4,
};

/**
 * Accept only small base64 image data URLs. The browser currently sends resized
 * JPEGs; PNG and WebP are accepted for safe API use as well.
 */
export function parseImageDataUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    return { ok: false, reason: "An image is required for moderation." };
  }

  const match = DATA_URL_PATTERN.exec(value);
  if (!match) {
    return { ok: false, reason: "The image format is invalid. Please choose a JPG, PNG, or WebP image." };
  }

  const base64 = match[2];
  const estimatedBytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (estimatedBytes <= 0 || estimatedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "The image is too large to verify. Please choose a smaller image." };
  }

  const contentType = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  return { ok: true, contentType, base64, buffer: Buffer.from(base64, "base64") };
}

/**
 * Policy:
 * - LIKELY / VERY_LIKELY in adult, racy, or violence: reject.
 * - POSSIBLE, UNKNOWN, or missing values: hold for human review (not publishable).
 * - VERY_UNLIKELY / UNLIKELY in all three categories: SafeSearch passes.
 */
export function evaluateSafeSearch(annotation) {
  if (!annotation || typeof annotation !== "object") {
    return { allowed: false, reviewRequired: true, reason: "Image verification needs manual review." };
  }

  const categories = ["adult", "racy", "violence"];
  const values = Object.fromEntries(categories.map((key) => [key, String(annotation[key] || "UNKNOWN").toUpperCase()]));

  const invalid = categories.some((key) => !(values[key] in LIKELIHOOD_RANK));
  if (invalid) {
    return { allowed: false, reviewRequired: true, reason: "Image verification returned an unknown result and needs manual review." };
  }

  const blocked = categories.filter((key) => LIKELIHOOD_RANK[values[key]] >= LIKELIHOOD_RANK.LIKELY);
  if (blocked.length) {
    return { allowed: false, reviewRequired: false, reason: "This image may contain disallowed adult, suggestive, or violent content." };
  }

  const borderline = categories.filter((key) => LIKELIHOOD_RANK[values[key]] === LIKELIHOOD_RANK.POSSIBLE);
  if (borderline.length) {
    return { allowed: false, reviewRequired: true, reason: "This image is borderline and cannot be published until a moderator reviews it." };
  }

  return { allowed: true, reviewRequired: false, reason: null };
}

/** Detector is injected so policy and failure behavior can be tested without Google credentials. */
export async function runSafeSearch(imageDataUrl, detect) {
  const parsed = parseImageDataUrl(imageDataUrl);
  if (!parsed.ok) {
    return { ...parsed, allowed: false, reviewRequired: false };
  }

  try {
    const annotation = await detect(parsed.buffer, parsed.contentType);
    const decision = evaluateSafeSearch(annotation);
    return { ...decision, signals: {
      adult: String(annotation?.adult || "UNKNOWN").toUpperCase(),
      racy: String(annotation?.racy || "UNKNOWN").toUpperCase(),
      violence: String(annotation?.violence || "UNKNOWN").toUpperCase(),
    } };
  } catch {
    // Do not include provider errors, image data, or credentials in the response/log.
    return {
      allowed: false,
      reviewRequired: false,
      serviceError: true,
      reason: "Image safety verification is temporarily unavailable. Your image was not published. Please try again later.",
    };
  }
}
