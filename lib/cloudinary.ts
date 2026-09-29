/**
 * Utility for Cloudinary image URL transformation and bandwidth optimization.
 */

/**
 * Injects width, format (f_auto), quality (q_auto), and limit crop (c_limit)
 * transformations into Cloudinary image URLs to drastically reduce bandwidth consumption.
 *
 * @param url - The original image URL (Cloudinary URL, local asset path, external URL, or falsy value)
 * @param width - Target maximum width in pixels (default: 600)
 * @returns The optimized Cloudinary URL or the original URL unmodified
 */
export function getOptimizedCloudinaryUrl(
  url?: string | null | undefined,
  width: number = 600
): string {
  if (!url || typeof url !== "string") {
    return (url as unknown as string) || "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  // Validate that it is a Cloudinary URL with res.cloudinary.com domain
  if (!trimmed.includes("res.cloudinary.com")) {
    return trimmed;
  }

  const uploadTag = "/image/upload/";
  const uploadIndex = trimmed.indexOf(uploadTag);
  if (uploadIndex === -1) {
    return trimmed;
  }

  const afterUpload = trimmed.slice(uploadIndex + uploadTag.length);

  // Check if transformations already exist in the URL
  // Detect /f_auto,q_auto/ or parameters like /w_... / w_600 / etc.
  const hasWidthTransform = /\bw_\d+\b/.test(afterUpload);
  const hasFormatOrQualityTransform =
    afterUpload.includes("f_auto") || afterUpload.includes("q_auto");

  if (hasWidthTransform || hasFormatOrQualityTransform) {
    return trimmed;
  }

  // Inject /image/upload/w_{width},c_limit,f_auto,q_auto/
  const transformation = `w_${width},c_limit,f_auto,q_auto/`;
  const beforeUpload = trimmed.slice(0, uploadIndex + uploadTag.length);

  return `${beforeUpload}${transformation}${afterUpload}`;
}

// Aliases for compatibility
export const optimizeCloudinaryUrl = getOptimizedCloudinaryUrl;
export const getCloudinaryUrl = getOptimizedCloudinaryUrl;
