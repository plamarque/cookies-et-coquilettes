import assert from "node:assert/strict";
import test from "node:test";
import { buildInstagramEmbedUrl } from "../src/utils/instagram-embed";

test("buildInstagramEmbedUrl returns embed URL for instagram post", () => {
  const result = buildInstagramEmbedUrl("https://www.instagram.com/p/DIus4gjuMpZ/");
  assert.equal(result, "https://www.instagram.com/p/DIus4gjuMpZ/embed");
});

test("buildInstagramEmbedUrl supports reel URLs with query params", () => {
  const result = buildInstagramEmbedUrl("https://instagram.com/reel/DGRshNYRBQQ/?igsh=abc");
  assert.equal(result, "https://www.instagram.com/reel/DGRshNYRBQQ/embed");
});

test("buildInstagramEmbedUrl supports tv URLs on mobile host", () => {
  const result = buildInstagramEmbedUrl("https://m.instagram.com/tv/CdmYaq3LAYo/");
  assert.equal(result, "https://www.instagram.com/tv/CdmYaq3LAYo/embed");
});

test("buildInstagramEmbedUrl returns undefined for non-instagram host", () => {
  const result = buildInstagramEmbedUrl("https://example.com/p/DIus4gjuMpZ/");
  assert.equal(result, undefined);
});

test("buildInstagramEmbedUrl returns undefined for unsupported path kind", () => {
  const result = buildInstagramEmbedUrl("https://www.instagram.com/stories/someone/123456/");
  assert.equal(result, undefined);
});

test("buildInstagramEmbedUrl returns undefined for invalid URL", () => {
  const result = buildInstagramEmbedUrl("not a url");
  assert.equal(result, undefined);
});
