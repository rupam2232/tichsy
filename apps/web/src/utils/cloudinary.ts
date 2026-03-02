/**
 * Utility to optimize Cloudinary image URLs on the fly by injecting transformation parameters.
 *
 * @param url The original image URL.
 * @param width The target width mapping.
 * @param height The target height mapping.
 * @returns The optimized Cloudinary URL for bandwidth savings, or the original URL if not Cloudinary/is a local blob UI preview.
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  width: number,
  height: number,
): string | undefined {
  if (!url) return undefined;

  // Do not modify local preview blobs or non-Cloudinary external links (like Google Auth avatars)
  if (url.startsWith("blob:") || !url.includes("cloudinary.com")) {
    return url;
  }

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  // c_fill: Crop the image to perfectly fill the bounding box while maintaining aspect ratio
  // q_auto: Automatically adjust quality to reduce file size without visible degradation
  // f_auto: Automatically send WebP/AVIF format based on the requesting browser's capabilities
  const transformations = `c_fill,w_${width},h_${height},q_auto,f_auto`;

  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}
