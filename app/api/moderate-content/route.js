import { NextResponse } from "next/server";
import { moderateImage } from "../../../lib/server/moderation";
import { parseImageDataUrl } from "../../../lib/server/safeSearch";

export const runtime = "nodejs";

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

  const image = parseImageDataUrl(body.imageDataUrl);
  if (!image.ok) return NextResponse.json({ allowed: false, reason: image.reason }, { status: 400 });

  const text = [body.brandName, body.note, body.title, body.body]
    .filter((value) => typeof value === "string")
    .join("\n")
    .slice(0, 8000);

  const result = await moderateImage(body.imageDataUrl, text);
  return NextResponse.json({
    allowed: result.allowed === true,
    ...(result.reason ? { reason: result.reason } : {}),
    ...(result.reviewRequired ? { reviewRequired: true } : {}),
  }, { status: result.status || 200 });
}
