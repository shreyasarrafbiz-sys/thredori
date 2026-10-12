import { parseImageDataUrl } from "./safeSearch";

const MAX_IMAGES = 10;
const MAX_TOTAL_DATA_URL_CHARS = 3_400_000;
const MAX_TEXT_LENGTH = 4000;

export async function processPublishRequest(request, deps) {
  const authorization = request.headers.get("authorization") || "";
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!tokenMatch) return { status: 401, body: { error: "Sign in to publish a post." } };

  let user;
  try {
    user = await deps.authenticate(tokenMatch[1]);
  } catch {
    user = null;
  }
  if (!user?.id) return { status: 401, body: { error: "Your session is invalid or expired. Please sign in again." } };

  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { error: "Invalid post request." } };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { status: 400, body: { error: "Invalid post request." } };
  }

  const images = body.images;
  if (!Array.isArray(images) || images.length < 1 || images.length > MAX_IMAGES) {
    return { status: 400, body: { error: "Choose between 1 and 10 images." } };
  }
  if (images.some((image) => typeof image !== "string") || images.reduce((sum, image) => sum + image.length, 0) > MAX_TOTAL_DATA_URL_CHARS) {
    return { status: 413, body: { error: "These images are too large to process together. Choose fewer or smaller images." } };
  }
  const parsedImages = images.map(parseImageDataUrl);
  if (parsedImages.some((image) => !image.ok)) {
    return { status: 400, body: { error: "One or more images are invalid or too large." } };
  }

  const postType = body.postType === "thread" ? "thread" : "post";
  const brandName = typeof body.brandName === "string" ? body.brandName.trim().slice(0, 180) : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_TEXT_LENGTH) : "";
  const textBody = typeof body.body === "string" ? body.body.trim().slice(0, MAX_TEXT_LENGTH) : "";
  const brandLink = typeof body.brandLink === "string" ? body.brandLink.trim().slice(0, 2048) : "";
  const category = body.category === "Home" && postType === "post" ? "Home" : postType === "thread" ? "Discussion" : "Fashion";
  if (!brandName) return { status: 400, body: { error: "A brand name or discussion title is required." } };

  // Moderate all images before the first Storage write. Borderline results are not published.
  for (let index = 0; index < images.length; index += 1) {
    let decision;
    try {
      decision = await deps.moderate(images[index], [brandName, note, textBody].filter(Boolean).join("\n"));
    } catch {
      return { status: 503, body: { error: "Image verification is temporarily unavailable. Nothing was published." } };
    }
    if (!decision || decision.allowed !== true) {
      return {
        status: decision?.status >= 400 ? decision.status : 422,
        body: {
          error: decision?.reason || "One or more images could not be approved. Nothing was published.",
          reviewRequired: decision?.reviewRequired === true,
          failedImage: index + 1,
        },
      };
    }
  }

  const uploadedPaths = [];
  const mediaUrls = [];
  try {
    for (let index = 0; index < parsedImages.length; index += 1) {
      const path = `${user.id}/${deps.createId()}.jpg`;
      const uploaded = await deps.upload(path, parsedImages[index].buffer);
      if (!uploaded?.publicUrl) throw new Error("Storage upload failed");
      uploadedPaths.push(path);
      mediaUrls.push(uploaded.publicUrl);
    }

    const inserted = await deps.insert({
      user_id: user.id,
      brand_name: brandName,
      note: postType === "post" ? note : null,
      body: postType === "thread" ? textBody : null,
      brand_link: postType === "post" ? brandLink : null,
      category,
      image_url: mediaUrls[0],
      media_urls: mediaUrls,
      post_type: postType,
    });
    if (inserted?.error) throw new Error("Post insert failed");
    return { status: 201, body: { ok: true, postId: inserted.id || null } };
  } catch {
    if (uploadedPaths.length) {
      try { await deps.remove(uploadedPaths); } catch { /* cleanup is best effort */ }
    }
    return { status: 500, body: { error: "We could not publish this post. Please try again." } };
  }
}
