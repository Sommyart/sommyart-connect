/** Crop an image file to a centered square and compress it to a small JPEG. */
export async function cropSquareAndCompress(file: File, size = 512, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not compress image");
  return blob;
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns an error message when the file is not a supported image under 5MB. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase()))
    return "Only JPG, PNG or WEBP images are supported";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 5MB or smaller";
  return null;
}

/** Crop an image to a 3:1 banner and compress it to a JPEG. */
export async function cropBannerAndCompress(file: File, width = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const height = Math.round(width / 3);
  const targetRatio = 3;
  const srcRatio = bitmap.width / bitmap.height;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (srcRatio > targetRatio) sw = bitmap.height * targetRatio;
  else sh = bitmap.width / targetRatio;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not compress image");
  return blob;
}
