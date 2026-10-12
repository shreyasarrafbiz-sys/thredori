import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSafeSearch, parseImageDataUrl, runSafeSearch } from "../lib/server/safeSearch.js";
import { processPublishRequest } from "../lib/server/publishPost.js";

const safe = { adult: "UNLIKELY", racy: "VERY_UNLIKELY", violence: "UNLIKELY" };
const imageDataUrl = `data:image/jpeg;base64,${Buffer.from("test image bytes").toString("base64")}`;
const makeRequest = (body, token = "valid-token") => new Request("https://thredori.test/api/posts/create", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});
const validBody = (images = [imageDataUrl]) => ({
  images, postType: "post", brandName: "Test brand", note: "A test",
  body: "", brandLink: "", category: "Fashion",
});
function dependencies(overrides = {}) {
  const state = { moderations: 0, uploads: [], inserts: [], removed: [] };
  return {
    state,
    deps: {
      authenticate: async (token) => token === "valid-token" ? { id: "user-123" } : null,
      moderate: async () => { state.moderations += 1; return { allowed: true, status: 200 }; },
      createId: (() => { let id = 0; return () => `id-${++id}`; })(),
      upload: async (path) => { state.uploads.push(path); return { publicUrl: `https://storage.test/${path}` }; },
      insert: async (post) => { state.inserts.push(post); return { id: "post-1" }; },
      remove: async (paths) => { state.removed.push(...paths); },
      ...overrides,
    },
  };
}

test("allows images with low adult, racy, and violence likelihoods", async () => {
  const result = await runSafeSearch(imageDataUrl, async () => safe);
  assert.equal(result.allowed, true);
  assert.equal(result.reviewRequired, false);
});

test("rejects LIKELY and VERY_LIKELY signals", () => {
  for (const likelihood of ["LIKELY", "VERY_LIKELY"]) {
    const result = evaluateSafeSearch({ ...safe, adult: likelihood });
    assert.equal(result.allowed, false);
    assert.equal(result.reviewRequired, false);
  }
});

test("holds POSSIBLE borderline results and does not allow publication", async () => {
  const result = await runSafeSearch(imageDataUrl, async () => ({ ...safe, racy: "POSSIBLE" }));
  assert.equal(result.allowed, false);
  assert.equal(result.reviewRequired, true);
});

test("rejects invalid image input before calling Google", async () => {
  assert.equal(parseImageDataUrl("").ok, false);
  assert.equal(parseImageDataUrl("https://example.com/image.jpg").ok, false);
  let called = false;
  const result = await runSafeSearch("not-an-image", async () => { called = true; return safe; });
  assert.equal(result.allowed, false);
  assert.equal(called, false);
});

test("fails closed when the Google API call fails", async () => {
  const result = await runSafeSearch(imageDataUrl, async () => { throw new Error("secret provider detail"); });
  assert.equal(result.allowed, false);
  assert.equal(result.serviceError, true);
  assert.doesNotMatch(result.reason, /secret provider detail/);
});

test("rejects unauthenticated publication requests without uploading", async () => {
  const { deps, state } = dependencies();
  const result = await processPublishRequest(makeRequest(validBody(), null), deps);
  assert.equal(result.status, 401);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test("rejects invalid or unauthorized bearer tokens without uploading", async () => {
  const { deps, state } = dependencies();
  const result = await processPublishRequest(makeRequest(validBody(), "forged-token"), deps);
  assert.equal(result.status, 401);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test("moderates every image before any upload and publishes a multi-image post", async () => {
  const { deps, state } = dependencies();
  const result = await processPublishRequest(makeRequest(validBody([imageDataUrl, imageDataUrl])), deps);
  assert.equal(result.status, 201);
  assert.equal(state.moderations, 2);
  assert.equal(state.uploads.length, 2);
  assert.equal(state.inserts.length, 1);
  assert.equal(state.inserts[0].user_id, "user-123");
  assert.equal(state.inserts[0].media_urls.length, 2);
});

test("does not upload or publish if any image fails moderation", async () => {
  const { deps, state } = dependencies({
    moderate: async () => { state.moderations += 1; return { allowed: false, reviewRequired: true, status: 200, reason: "Borderline" }; },
  });
  const result = await processPublishRequest(makeRequest(validBody([imageDataUrl, imageDataUrl])), deps);
  assert.equal(result.status, 422);
  assert.equal(result.body.reviewRequired, true);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test("fails closed on moderation-provider failures", async () => {
  const { deps, state } = dependencies({
    moderate: async () => { state.moderations += 1; return { allowed: false, status: 503, reason: "Unavailable" }; },
  });
  const result = await processPublishRequest(makeRequest(validBody()), deps);
  assert.equal(result.status, 503);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test("client attempts to bypass moderation cannot reach upload or insert", async () => {
  const { deps, state } = dependencies({
    moderate: async () => ({ allowed: false, status: 200, reason: "Blocked" }),
  });
  const result = await processPublishRequest(makeRequest({ ...validBody(), user_id: "attacker-controlled-id" }), deps);
  assert.equal(result.status, 422);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});
