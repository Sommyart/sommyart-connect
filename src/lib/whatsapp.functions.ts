import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const WHATSAPP_LINK = "https://chat.whatsapp.com/ExPajqlPlcKL2f2bnqpwwC";

export const getMyConsent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin } = await import("./auth.server");
    const me = await memberForToken(data.token);
    if (!me) return null;
    const { data: row } = await supabaseAdmin
      .from("whatsapp_consents")
      .select("accepted,accepted_at,join_clicked,joined_at")
      .eq("member_id", me.id)
      .maybeSingle();
    return row ?? { accepted: false, accepted_at: null, join_clicked: false, joined_at: null };
  });

export const recordConsent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(10),
        accepted: z.boolean(),
        device: z.string().trim().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin } = await import("./auth.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Not signed in");

    const { error } = await supabaseAdmin.from("whatsapp_consents").upsert(
      {
        member_id: me.id,
        nickname: me.nickname,
        real_name: me.real_name,
        accepted: data.accepted,
        accepted_at: data.accepted ? new Date().toISOString() : null,
        device: data.device ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_id" },
    );
    if (error) throw new Error(error.message);
    return { accepted: data.accepted };
  });

export const recordJoinClick = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin } = await import("./auth.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Not signed in");
    await supabaseAdmin
      .from("whatsapp_consents")
      .update({ join_clicked: true, joined_at: new Date().toISOString() })
      .eq("member_id", me.id);
    return { ok: true };
  });
