import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const profileSchema = z.object({
  token: z.string().min(1),
  nickname: z.string().trim().min(2).max(40),
  occupation: z.string().trim().min(2).max(100),
  password_hint: z.string().trim().min(2).max(120),
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin, MEMBER_FIELDS } = await import("./auth.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Your session has expired. Please log in again.");

    const { data: taken } = await supabaseAdmin
      .from("members")
      .select("id")
      .ilike("nickname", data.nickname)
      .neq("id", me.id)
      .maybeSingle();
    if (taken) throw new Error("That nickname is already taken");

    const { data: member, error } = await supabaseAdmin
      .from("members")
      .update({
        nickname: data.nickname,
        occupation: data.occupation,
        password_hint: data.password_hint,
        updated_at: new Date().toISOString(),
      })
      .eq("id", me.id)
      .select(MEMBER_FIELDS)
      .single();
    if (error) throw new Error(error.message);
    return { member };
  });

export const updateProfilePicture = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ token: z.string().min(1), path: z.string().trim().max(300).nullable() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin, MEMBER_FIELDS } = await import("./auth.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Your session has expired. Please log in again.");

    const previous = me.profile_picture;
    const { data: member, error } = await supabaseAdmin
      .from("members")
      .update({ profile_picture: data.path, updated_at: new Date().toISOString() })
      .eq("id", me.id)
      .select(MEMBER_FIELDS)
      .single();
    if (error) throw new Error(error.message);

    if (previous && previous !== data.path) {
      await supabaseAdmin.storage.from("profile-pictures").remove([previous]);
    }
    return { member };
  });
