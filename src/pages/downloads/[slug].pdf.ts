import type { APIRoute } from "astro";
import config from "@/config/config.json";
import { getSinglePage } from "@/lib/contentParser.astro";
import { buildArticlePdf } from "@/lib/articlePdf";

export async function getStaticPaths() {
  const posts = await getSinglePage("posts");
  return posts.map((post) => {
    const title = String(post.data.title ?? "Untitled").replace(/\s+/g, " ").trim();
    const dateValue = post.data.date ? new Date(post.data.date) : undefined;
    const publishedDate =
      dateValue && Number.isFinite(dateValue.getTime())
        ? dateValue.toISOString().slice(0, 10)
        : undefined;
    const sourceUrl = new URL(`/blog/${encodeURIComponent(post.id)}/`, config.site.base_url).href;
    return {
      params: { slug: post.id },
      props: {
        title,
        body: String(post.body ?? ""),
        coverImagePath: String(post.data.image ?? ""),
        coverImageAlt: String(post.data.image_alt ?? title),
        publishedDate,
        sourceUrl,
      },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const pdf = await buildArticlePdf({
    title: String(props.title ?? "Untitled"),
    body: String(props.body ?? ""),
    coverImagePath: String(props.coverImagePath ?? ""),
    coverImageAlt: String(props.coverImageAlt ?? props.title ?? ""),
    publishedDate: props.publishedDate ? String(props.publishedDate) : undefined,
    sourceUrl: String(props.sourceUrl ?? config.site.base_url),
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
};
