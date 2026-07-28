import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ITERATIONS = 100_000;

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string, saltHex?: string) {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  const saltOut = saltHex ?? toHex(salt.buffer as ArrayBuffer);
  return `pbkdf2$${ITERATIONS}$${saltOut}$${toHex(bits)}`;
}

export async function verifyPin(pin: string, stored: string | null) {
  if (!stored) return false;
  const [, , salt] = stored.split("$");
  if (!salt) return false;
  const candidate = await hashPin(pin, salt);
  if (candidate.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

export async function sha256(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export type PublicMember = {
  id: string;
  real_name: string;
  nickname: string;
  birth_day: number;
  birth_month: number;
  occupation: string;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
};

const MEMBER_FIELDS =
  "id,real_name,nickname,birth_day,birth_month,occupation,profile_picture,is_active,created_at";

export async function createSession(memberId: string) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const { error } = await supabaseAdmin
    .from("member_sessions")
    .insert({ member_id: memberId, token_hash: await sha256(token) });
  if (error) throw new Error(error.message);
  return token;
}

export async function memberForToken(token: string): Promise<PublicMember | null> {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from("member_sessions")
    .select("member_id,expires_at")
    .eq("token_hash", await sha256(token))
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  const { data: member } = await supabaseAdmin
    .from("members")
    .select(MEMBER_FIELDS)
    .eq("id", data.member_id)
    .maybeSingle();
  if (!member || member.is_active === false) return null;
  return member as PublicMember;
}

export { MEMBER_FIELDS, supabaseAdmin };
