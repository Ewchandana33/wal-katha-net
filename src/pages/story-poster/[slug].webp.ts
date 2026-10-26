import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import path from "node:path";
import config from "@/config/config.json";
import noindexPostIds from "@/config/noindex-post-ids.json";
import { getSinglePage } from "@/lib/contentParser.astro";
import { selectWebStories } from "@/lib/webStories.mjs";
import { createWebStoryPoster } from "@/lib/webStoryPoster.mjs";

export const prerender = true;

export async function getStaticPaths() {
  const posts = await getSinglePage("posts");
  const stories = selectWebStories(posts, new Set(noindexPostIds));

  return stories.map((story) => ({
    params: { slug: story.id },
    props: {
      imagePath: path.resolve(
        process.cwd(),
        "public",
        String(story.data.image).replace(/^\/+/, ""),
      ),
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const imageBuffer = await readFile(String(props.imagePath));
  const poster = await createWebStoryPoster(imageBuffer);

  return new Response(poster, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
};
