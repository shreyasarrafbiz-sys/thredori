import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { moderateImage } from "../../../lib/server/moderation";
import { parseImageDataUrl } from "../../../lib/server/safeSearch";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const tokenMatch = /^Bearer\\s+(.+)$/i.exec(authorization);
  if (!tokenMatch || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ allowed: false, reason: "Sign in to verify content." }, { status: 401 });
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data: authData, error: authError } = await authClient.auth.getUser(tokenMatch[1]);
  if (authError || !authData?.user) {
    return NextResponse.json({ allowed: false, reason: "Your session is invalid or expired." }, { status: 401 });
  }

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
