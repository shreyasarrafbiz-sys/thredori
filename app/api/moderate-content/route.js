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
    if (imageDataUrl) input.push({ type: "image_url", image_url: { url: imageDataUrl } });

    const moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
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

    if (!moderationResponse.ok) {
      console.error("OpenAI moderation error", await moderationResponse.text());
      return NextResponse.json(
        { allowed: false, reason: "We could not verify this post. Please try again." },
        { status: 502 }
      );
    }

    const result = await moderationResponse.json();
    const moderation = result?.results?.[0];
    const categories = moderation?.categories || {};
    const blockedCategory = BLOCKED_CATEGORIES.find((category) => categories[category] === true);

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
