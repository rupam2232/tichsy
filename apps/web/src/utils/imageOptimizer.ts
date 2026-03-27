/**
 * Utility to optimize Cloudinary image URLs on the fly by injecting transformation parameters.
 *
 * @param url The original image URL.
 * @param width The target width mapping.
 * @param height The target height mapping.
 * @param params Additional transformation parameters.
 * @returns The optimized Cloudinary URL for bandwidth savings, or the original URL if not Cloudinary/is a local blob UI preview.
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  width: number,
  height: number,
  params?: string,
): string | undefined {
  if (!url) return undefined;

  // Do not modify local preview blobs or non-Cloudinary external links (like Google Auth avatars)
  if (url.startsWith("blob:") || !url.includes("cloudinary.com")) {
    return url;
  }

  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;

  // Remove pre-existing transformations to avoid conflicting double-scaling (e.g., down to 64 then back to 500)
  // Cloudinary transformations are segments that contain an underscore (like w_500, c_fill) 
  // and are located immediately after /upload/. We'll filter out such segments until we hit a version string (v1234...) or the public ID.
  const afterUpload = parts[1]!.split("/");
  const cleanParts = afterUpload.filter((segment) => {
    // Keep version strings (v12345...) and any segment that doesn't look like a transformation list
    return segment.startsWith("v") && !isNaN(parseInt(segment.replace("v", ""))) || !segment.includes("_") || segment.includes(".");
  });

  // c_fill: Crop the image to perfectly fill the bounding box while maintaining aspect ratio
  // q_auto: Automatically adjust quality to reduce file size without visible degradation
  // f_auto: Automatically send WebP/AVIF format based on the requesting browser's capabilities
  const transformations = `c_fill,w_${width},h_${height},q_auto,f_auto${params ? `,${params}` : ""}`;

  return `${parts[0]}/upload/${transformations}/${cleanParts.join("/")}`;
}

/**
 * Loader for Next.js Image component to optimize Cloudinary images.
 *
 * @param src The original image URL.
 * @param width The target width mapping.
 * @param quality The target quality mapping.
 * @returns The optimized Cloudinary URL for bandwidth savings, or the original URL if not Cloudinary/is a local blob UI preview.
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes("cloudinary.com")) return src;

  const params = [
    "f_auto",
    "c_fill",
    `w_${width}`,
    `h_${width}`,
    `q_${quality || "auto"}`,
  ];
  const parts = src.split("/upload/");
  if (parts.length !== 2 || !parts[1]) return src;
  
  const afterUpload = parts[1].split("/");
  const cleanParts = afterUpload.filter((segment) => {
    return segment.startsWith("v") && !isNaN(parseInt(segment.replace("v", ""))) || !segment.includes("_") || segment.includes(".");
  });

  return `${parts[0]}/upload/${params.join(",")}/${cleanParts.join("/")}`;
}
