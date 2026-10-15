import type { APIRoute } from "astro";
import config from "@/config/config.json";
import { getSinglePage } from "@/lib/contentParser.astro";

export async function getStaticPaths() {
  const posts = await getSinglePage("posts");
  return posts.map((post) => {
    const title = String(post.data.title ?? "Untitled").replace(/\s+/g, " ").trim();
    const dateValue = post.data.date ? new Date(post.data.date) : undefined;
    const publishedDate = dateValue && Number.isFinite(dateValue.getTime())
      ? dateValue.toISOString().slice(0, 10)
      : undefined;
    const sourceUrl = new URL(`/blog/${encodeURIComponent(post.id)}/`, config.site.base_url).href;
    const markdown = [
      `# ${title}` ,
      "",
      `[මුල් ලිපිය කියවන්න](${sourceUrl})`,
      ...(publishedDate ? [`පළ කළ දිනය: ${publishedDate}`] : []),
      "",
      "---",
      "",
      String(post.body ?? "").trim(),
      "",
    ].join("\n");
    return { params: { slug: post.id }, props: { markdown } };
  });
}

export const GET: APIRoute = ({ props }) =>
  new Response(String(props.markdown ?? ""), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
