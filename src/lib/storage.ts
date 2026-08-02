import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

/** Upload a file into the caller's own folder in the media bucket. */
export async function uploadMedia(userId: string, file: Blob, ext = "jpg"): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Resolve a stored media path to a temporary viewable URL. */
export async function mediaUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const hit = cache.get(path);
  if (hit) return hit;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24);
  if (!data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}

export function extFor(file: File): string {
  const type = file.type.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.startsWith("video/")) return type.includes("webm") ? "webm" : "mp4";
  return "jpg";
}
