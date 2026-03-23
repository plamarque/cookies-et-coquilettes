import assert from "node:assert/strict";
import test from "node:test";
import { extractInstructionSteps } from "../src/parsing-client.js";

test("extractInstructionSteps flattens text-only string", () => {
  const steps = extractInstructionSteps("Mélanger.", "https://ex.com/");
  assert.equal(steps.length, 1);
  assert.equal(steps[0].text, "Mélanger.");
  assert.equal(steps[0].media, undefined);
});

test("extractInstructionSteps collects multiple images and video on HowToStep-like node", () => {
  const raw = {
    "@type": "HowToStep",
    text: "Cuire à feu doux.",
    image: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
    video: {
      "@type": "VideoObject",
      contentUrl: "https://videos.example.com/step.mp4",
      embedUrl: "https://player.example.com/embed/xyz"
    }
  };
  const steps = extractInstructionSteps(raw, "https://site.com/recipe/");
  assert.equal(steps.length, 1);
  assert.ok(steps[0].text.includes("Cuire"));
  const media = steps[0].media;
  assert.ok(media);
  assert.equal(media!.length, 4);
  assert.equal(media![0].type, "image");
  assert.equal((media![0] as { imageUrl: string }).imageUrl, "https://cdn.example.com/a.jpg");
  assert.equal(media![1].type, "image");
  assert.equal((media![2] as { type: string; url: string }).type, "video");
  assert.equal((media![2] as { url: string }).url, "https://videos.example.com/step.mp4");
  assert.equal((media![3] as { url: string }).url, "https://player.example.com/embed/xyz");
});

test("extractInstructionSteps resolves relative image against baseUrl", () => {
  const raw = {
    text: "Étape 1",
    image: "/uploads/photo.webp"
  };
  const steps = extractInstructionSteps(raw, "https://blog.example.org/posts/tarte/");
  assert.equal(steps.length, 1);
  assert.equal(steps[0].media?.length, 1);
  assert.equal(
    (steps[0].media![0] as { imageUrl: string }).imageUrl,
    "https://blog.example.org/uploads/photo.webp"
  );
});
