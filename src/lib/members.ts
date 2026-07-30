import { supabase } from "@/integrations/supabase/client";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export type Member = {
  id: string;
  real_name: string;
  nickname: string;
  birth_day: number;
  birth_month: number;
  occupation: string;
  profile_picture: string | null;
  created_at: string;
};

const STORAGE_KEY = "awka-connect-member";
export const BUCKET = "profile-pictures";

export function saveLocalMember(member: Member) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
}

export function getLocalMember(): Member | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Member) : null;
  } catch {
    return null;
  }
}

export function clearLocalMember() {
  localStorage.removeItem(STORAGE_KEY);
}

export function birthdayLabel(day: number, month: number) {
  return `${day} ${MONTHS[month - 1] ?? ""}`;
}

/** Profile pictures live in a private bucket, so resolve a signed display URL. */
export async function getPictureUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

export async function uploadProfilePicture(blob: Blob): Promise<string> {
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Upload any processed image blob to the shared media bucket. */
export async function uploadImageBlob(blob: Blob, prefix = ""): Promise<string> {
  const path = `${prefix}${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
