import assert from "node:assert/strict";
import test from "node:test";
import { extractHtmlInlineStepMediaSegments } from "../src/parsing-client.js";

test("extractHtmlInlineStepMediaSegments: uk-lightbox gallery after each step (Thomas-style)", () => {
  const html = `<div class="contenu_recette">
<p>Faire ramollir la gélatine dans un grand volume d'eau froide.</p>
<p uk-lightbox><a href="https://blog.example/wp/56.jpg">x</a></p>
<p>Laver et zester la peau des 2 citrons.</p>
<p uk-lightbox><a href="https://blog.example/wp/lc1.jpg">x</a></p>
</div>`;
  const segs = extractHtmlInlineStepMediaSegments(html, "https://blog.example/recette/");
  assert.equal(segs.length, 2);
  assert.ok(segs[0].imageUrls.some((u) => u.endsWith("/56.jpg")));
  assert.ok(segs[1].imageUrls.some((u) => u.endsWith("/lc1.jpg")));
});

test("extractHtmlInlineStepMediaSegments: no image merged from gallery after outro paragraph", () => {
  const html = `<div class="contenu_recette">
<p>Verser dans un bocal et conserver au frais jusqu'à utilisation.</p>
<p>Voilà, votre délicieux dessert est terminé, j'espère que cette recette vous plaira.</p>
<p uk-lightbox><a href="https://blog.example/wp/outro-only.jpg">x</a></p>
</div>`;
  const segs = extractHtmlInlineStepMediaSegments(html, "https://blog.example/r/");
  assert.equal(segs.length, 1);
  assert.equal(segs[0].imageUrls.length, 0);
});
