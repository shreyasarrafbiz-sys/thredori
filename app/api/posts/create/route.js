import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { moderateImage } from "../../../../lib/server/moderation";
import { processPublishRequest } from "../../../../lib/server/publishPost";

export const runtime = "nodejs";
export const maxDuration = 60;

function makeAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server publication is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function POST(request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Post publishing is not configured." }, { status: 503 });
  }

  const result = await processPublishRequest(request, {
    async authenticate(accessToken) {
      const { data, error } = await makeAuthClient().auth.getUser(accessToken);
      if (error || !data?.user) return null;
      return { id: data.user.id };
    },
    moderate: moderateImage,
    createId: () => crypto.randomUUID(),
    async upload(path, buffer) {
      const admin = makeAdminClient();
      const extension = path.split(".").pop();
      const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
      const { error } = await admin.storage.from("post-images").upload(path, buffer, { contentType, upsert: false });
      if (error) throw new Error("Storage upload failed");
      const { data } = admin.storage.from("post-images").getPublicUrl(path);
      return { publicUrl: data.publicUrl };
    },
    async insert(post) {
      const { data, error } = await makeAdminClient().from("posts").insert(post).select("id").single();
      return error ? { error: true } : { id: data.id };
    },
    async remove(paths) {
      const { error } = await makeAdminClient().storage.from("post-images").remove(paths);
      if (error) throw new Error("Storage cleanup failed");
    },
  });

  return NextResponse.json(result.body, { status: result.status });
}
