import { NextResponse } from "next/server";

const BLOCKED_CATEGORIES = [
  "sexual", "sexual/minors", "violence", "violence/graphic",
  "self-harm", "self-harm/intent", "self-harm/instructions",
  "hate", "hate/threatening", "harassment", "harassment/threatening",
  "illicit", "illicit/violent",
];

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { allowed: false, code: "MISSING_API_KEY", reason: "Content moderation is not configured yet. Add OPENAI_API_KEY to the Vercel project environment variables." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const text = [body.brandName, body.note, body.title, body.body]
      .filter(Boolean).join("\n").trim();
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";

    if (!text && !imageDataUrl) return NextResponse.json({ allowed: true });

    const input = [];
    if (text) input.push({ type: "text", text });
    if (imageDataUrl) input.push({ type: "image_url", image_url: { url: imageDataUrl } });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let moderationResponse;
    try {
      moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "omni-moderation-latest", input }),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error("OpenAI moderation network error", error);
      return NextResponse.json(
        { allowed: false, code: "OPENAI_NETWORK_ERROR", reason: error?.name === "AbortError" ? "Content verification timed out. Please try again." : "We could not reach the content verification service. Please try again." },
        { status: 502 }
      );
    }
    clearTimeout(timeout);

    if (!moderationResponse.ok) {
      const raw = await moderationResponse.text();
      console.error("OpenAI moderation API error", {
        status: moderationResponse.status,
        statusText: moderationResponse.statusText,
        response: raw,
      });

      let apiMessage = "";
      try {
        apiMessage = JSON.parse(raw)?.error?.message || "";
      } catch {}

      let reason = "We could not verify this post. Please try again.";
      if (moderationResponse.status === 401) reason = "Content verification is not authorized. Check the OPENAI_API_KEY configured in Vercel.";
      else if (moderationResponse.status === 429) reason = "Content verification is temporarily rate-limited. Please try again in a moment.";
      else if (moderationResponse.status === 400) reason = apiMessage ? `Content verification rejected the image: ${apiMessage}` : "The image could not be submitted for verification.";
      else if (moderationResponse.status >= 500) reason = "The content verification service is temporarily unavailable. Please try again.";

      return NextResponse.json(
        { allowed: false, code: `OPENAI_HTTP_${moderationResponse.status}`, reason },
        { status: 502 }
      );
    }

    const result = await moderationResponse.json();
    const moderation = result?.results?.[0];

    if (!moderation) {
      console.error("OpenAI moderation returned no result", result);
      return NextResponse.json(
        { allowed: false, code: "EMPTY_MODERATION_RESULT", reason: "Content verification returned an unexpected response. Please try again." },
        { status: 502 }
      );
    }

    const categories = moderation.categories || {};
    const blockedCategory = BLOCKED_CATEGORIES.find((category) => categories[category] === true);

    if (blockedCategory || moderation.flagged) {
      return NextResponse.json({
        allowed: false,
        code: "CONTENT_BLOCKED",
        reason: "This post contains content that is not allowed on Thredori.",
      });
    }

    return NextResponse.json({ allowed: true, code: "APPROVED" });
  } catch (error) {
    console.error("Content moderation failed", error);
    return NextResponse.json(
      { allowed: false, code: "MODERATION_SERVER_ERROR", reason: "We could not verify this post. Please try again." },
      { status: 500 }
    );
  }
}
