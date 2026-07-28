import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const nickname = z.string().trim().min(2).max(40);
const pin = z.string().regex(/^\d{4}$/, "PIN must be 4 digits");

const registerSchema = z.object({
  real_name: z.string().trim().min(2).max(100),
  nickname,
  pin,
  password_hint: z.string().trim().min(2).max(120),
  birth_day: z.number().int().min(1).max(31),
  birth_month: z.number().int().min(1).max(12),
  occupation: z.string().trim().min(2).max(100),
  profile_picture: z.string().trim().max(300).nullable().optional(),
});

export const registerMember = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registerSchema.parse(d))
  .handler(async ({ data }) => {
    const { hashPin, createSession, supabaseAdmin, MEMBER_FIELDS } = await import("./auth.server");

    const { data: existing } = await supabaseAdmin
      .from("members")
      .select("id")
      .ilike("nickname", data.nickname)
      .maybeSingle();
    if (existing) throw new Error("That nickname is already taken");

    const { data: member, error } = await supabaseAdmin
      .from("members")
      .insert({
        real_name: data.real_name,
        nickname: data.nickname,
        pin_hash: await hashPin(data.pin),
        password_hint: data.password_hint,
        birth_day: data.birth_day,
        birth_month: data.birth_month,
        occupation: data.occupation,
        profile_picture: data.profile_picture ?? null,
      })
      .select(MEMBER_FIELDS)
      .single();
    if (error) throw new Error(error.message);

    return { token: await createSession(member.id), member };
  });

export const loginMember = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ nickname, pin }).parse(d))
  .handler(async ({ data }) => {
    const { verifyPin, createSession, supabaseAdmin } = await import("./auth.server");
    const { data: row } = await supabaseAdmin
      .from("members")
      .select(
        "id,real_name,nickname,birth_day,birth_month,occupation,profile_picture,is_active,created_at,pin_hash",
      )
      .ilike("nickname", data.nickname)
      .maybeSingle();

    if (!row || !(await verifyPin(data.pin, row.pin_hash)))
      throw new Error("Nickname or PIN is incorrect");
    if (!row.is_active) throw new Error("Your account has been suspended. Contact an admin.");

    const { pin_hash: _pin, ...member } = row;
    return { token: await createSession(row.id), member };
  });

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { memberForToken } = await import("./auth.server");
    return { member: await memberForToken(data.token) };
  });

export const logoutMember = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin, sha256 } = await import("./auth.server");
    await supabaseAdmin.from("member_sessions").delete().eq("token_hash", await sha256(data.token));
    return { ok: true };
  });

export const getPinHint = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ nickname }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("./auth.server");
    const { data: row } = await supabaseAdmin
      .from("members")
      .select("password_hint")
      .ilike("nickname", data.nickname)
      .maybeSingle();
    return { hint: row?.password_hint ?? null };
  });

export const requestPinReset = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ nickname }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("./auth.server");
    await supabaseAdmin
      .from("members")
      .update({ pin_reset_requested: true })
      .ilike("nickname", data.nickname);
    return { ok: true };
  });
