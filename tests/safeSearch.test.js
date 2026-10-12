import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSafeSearch, parseImageDataUrl, runSafeSearch } from "../lib/server/safeSearch.js";

const safe = { adult: "UNLIKELY", racy: "VERY_UNLIKELY", violence: "UNLIKELY" };
const imageDataUrl = `data:image/jpeg;base64,${Buffer.from("test image bytes").toString("base64")}`;

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

test("holds POSSIBLE borderline results for manual review without publication", async () => {
  const result = await runSafeSearch(imageDataUrl, async () => ({ ...safe, racy: "POSSIBLE" }));
  assert.equal(result.allowed, false);
  assert.equal(result.reviewRequired, true);
  assert.match(result.reason, /moderator reviews/i);
});

test("rejects invalid and unsupported image inputs before calling Google", async () => {
  const missing = parseImageDataUrl("");
  const invalid = parseImageDataUrl("https://example.com/image.jpg");
  assert.equal(missing.ok, false);
  assert.equal(invalid.ok, false);
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
