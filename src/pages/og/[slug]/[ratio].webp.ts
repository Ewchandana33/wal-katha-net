import type { APIRoute, GetStaticPaths } from "astro";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getCollection } from "astro:content";
import noindexPostIds from "@/config/noindex-post-ids.json";
import seoImageVariants from "@/config/seo-image-variants.json";

export const prerender = true;

const publicDirectory = path.resolve(process.cwd(), "public");
const restrictedPostIds = new Set<string>(noindexPostIds);

type Variant = (typeof seoImageVariants.variants)[number];
type Post = { id: string; data: { image?: string } };

function getCoverPath(post: Post) {
  const image = post.data.image;
  if (typeof image !== "string" || !image.startsWith("/")) {
    throw new Error("Published, indexable post \"" + post.id + "\" needs a local cover image before SEO variants can be generated.");
  }

  const imagePath = path.resolve(publicDirectory, image.replace(/^\/+/, ""));
  if (!imagePath.startsWith(publicDirectory + path.sep) || !existsSync(imagePath)) {
    throw new Error("Published, indexable post \"" + post.id + "\" references a missing or unsafe cover image: " + image);
  }
  return imagePath;
}

export const getStaticPaths = (async () => {
  const posts = await getCollection("posts", ({ data, id }) =>
    !data.draft && !id.startsWith("-") && !restrictedPostIds.has(id),
  );

  return posts.flatMap((post) => {
    // Fail closed rather than publishing structured data with nonexistent image URLs.
    getCoverPath(post as Post);
    return seoImageVariants.variants.map((variant) => ({
      params: { slug: post.id, ratio: variant.ratio },
      props: { post, variant },
    }));
  });
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post, variant } = props as { post: Post; variant: Variant };
  const imagePath = getCoverPath(post);
  const image = await sharp(imagePath)
    .rotate()
    .resize(variant.width, variant.height, { fit: "cover", position: "centre" })
    .webp({ quality: 86, effort: 4 })
    .toBuffer();

  return new Response(new Uint8Array(image), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
