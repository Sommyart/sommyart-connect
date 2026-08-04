import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function verifyPassword(email: string, password: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Password is incorrect");
}

/** Everything the signed-in member has stored, as a JSON export. */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;

    const [profile, posts, projects, submissions, points, checkIns, notifications] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("posts").select("*").eq("author_id", uid),
      supabaseAdmin.from("projects").select("*").eq("owner_id", uid),
      supabaseAdmin.from("submissions").select("*").eq("author_id", uid),
      supabaseAdmin.from("points_log").select("*").eq("user_id", uid),
      supabaseAdmin.from("check_ins").select("*").eq("user_id", uid),
      supabaseAdmin.from("notifications").select("*").eq("user_id", uid),
    ]);

    return {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      posts: posts.data ?? [],
      projects: projects.data ?? [],
      submissions: submissions.data ?? [],
      points_log: points.data ?? [],
      check_ins: checkIns.data ?? [],
      notifications: notifications.data ?? [],
    };
  });

/** Hide the member from the community without deleting anything. */
export const setDeactivated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ deactivated: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ deactivated: data.deactivated, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Permanently delete the account after verifying the member's password. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ password: z.string().min(6).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) throw new Error("This account has no email to verify against");

    await verifyPassword(email, data.password);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
