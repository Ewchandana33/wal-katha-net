import assert from "node:assert/strict";
import test from "node:test";
import {
  renderPostComments,
  renderReviewComments,
} from "../functions/_shared/comment-indexability.js";

test("server-rendered post comments are escaped as text, not interpreted as markup", () => {
  const html = renderPostComments([
    {
      content: `පාඨක අදහස <script>alert("x")</script> & "පරීක්ෂණ"`,
      date: "Oct 28, 2026",
    },
  ]);

  assert.match(html, /data-server-rendered-comment="post"/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&amp; &quot;පරීක්ෂණ&quot;/);
  assert.doesNotMatch(html, /<script>/);
});

test("server-rendered post comments ignore blank and malformed records", () => {
  const html = renderPostComments([
    null,
    { content: "   " },
    { content: 42 },
    { content: "පළමු අදහස" },
  ]);

  assert.equal((html.match(/data-server-rendered-comment="post"/g) || []).length, 1);
  assert.match(html, /පළමු අදහස/);
});

test("server-rendered story-review comments include replies and escape user text", () => {
  const html = renderReviewComments([
    {
      body: "මූලික අදහස <img src=x onerror=alert(1)>",
      created_at: 1800000000,
      replies: [
        { body: "පිළිතුර & තවත්", created_at: 1800000010 },
      ],
    },
  ]);

  assert.equal((html.match(/data-server-rendered-comment="review"/g) || []).length, 2);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /පිළිතුර &amp; තවත්/);
  assert.doesNotMatch(html, /<img/);
});

test("review SSR is bounded to avoid unbounded page output", () => {
  const html = renderReviewComments(
    Array.from({ length: 105 }, (_, index) => ({ body: `අදහස ${index}` })),
  );

  assert.equal((html.match(/data-server-rendered-comment="review"/g) || []).length, 100);
});
