import sharp from "sharp";

const POSTER_WIDTH = 640;
const POSTER_HEIGHT = 853;

/**
 * Create the portrait poster required by the AMP Web Story wrapper.
 * The source image is read-only; the returned WebP is emitted by the
 * static endpoint during build and does not alter any article/PDF asset.
 *
 * @param {Buffer | Uint8Array} imageBuffer
 * @returns {Promise<Buffer>}
 */
export async function createWebStoryPoster(imageBuffer) {
  return sharp(imageBuffer)
    .resize(POSTER_WIDTH, POSTER_HEIGHT, {
      fit: "cover",
      position: "attention",
    })
    .webp({ quality: 82 })
    .toBuffer();
}
