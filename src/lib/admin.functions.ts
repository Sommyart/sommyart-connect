import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: { rpc: (fn: string, args: object) => Promise<{ data: unknown }> }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

/** Members list with search, for the admin console. */
export const adminListMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ search: z.string().max(80).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("profiles")
      .select("id,full_name,username,email,points,streak,suspended,deactivated,featured,created_at")
      .order("points", { ascending: false })
      .limit(200);
    if (data.search) query = query.or(`full_name.ilike.%${data.search}%,username.ilike.%${data.search}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Suspend, unsuspend or feature a member. */
export const adminUpdateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        suspended: z.boolean().optional(),
        featured: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin, notify } = await import("@/lib/points.server");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.suspended !== undefined) patch["suspended"] = data.suspended;
    if (data.featured !== undefined) patch["featured"] = data.featured;

    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.suspended !== undefined ? (data.suspended ? "suspend_member" : "unsuspend_member") : "feature_member",
      target_type: "profile",
      target_id: data.userId,
      meta: patch,
    });

    if (data.suspended) await notify(data.userId, "Account suspended", "Contact a moderator", "admin");
    return { ok: true };
  });

/** Open reports with their post content. */
export const adminListReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("post_reports")
      .select("id,reason,details,status,created_at,post_id,reporter_id,posts:post_id(content,author_id)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Resolve a report, optionally deleting the reported post. */
export const adminResolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ reportId: z.string().uuid(), deletePost: z.boolean().default(false) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: report } = await supabaseAdmin
      .from("post_reports")
      .select("post_id")
      .eq("id", data.reportId)
      .maybeSingle();

    if (data.deletePost && report?.post_id) {
      await supabaseAdmin.from("posts").delete().eq("id", report.post_id);
    }
    await supabaseAdmin
      .from("post_reports")
      .update({ status: data.deletePost ? "removed" : "dismissed" })
      .eq("id", data.reportId);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.deletePost ? "remove_post" : "dismiss_report",
      target_type: "post_report",
      target_id: data.reportId,
    });
    return { ok: true };
  });

/** DAU / WAU / MAU plus content counts. */
export const adminAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const day = new Date(Date.now() - 86_400_000).toISOString();
    const week = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const month = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [dau, wau, mau, members, posts, projects, submissions, games] = await Promise.all([
      supabaseAdmin.from("check_ins").select("user_id", { count: "exact", head: true }).gte("created_at", day),
      supabaseAdmin.from("check_ins").select("user_id", { count: "exact", head: true }).gte("created_at", week),
      supabaseAdmin.from("check_ins").select("user_id", { count: "exact", head: true }).gte("created_at", month),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("submissions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("game_scores").select("id", { count: "exact", head: true }).gte("created_at", week),
    ]);

    return {
      dau: dau.count ?? 0,
      wau: wau.count ?? 0,
      mau: mau.count ?? 0,
      members: members.count ?? 0,
      posts: posts.count ?? 0,
      projects: projects.count ?? 0,
      submissions: submissions.count ?? 0,
      gamesThisWeek: games.count ?? 0,
    };
  });

/** Recent admin actions. */
export const adminAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("audit_logs")
      .select("id,action,target_type,target_id,created_at,profiles:actor_id(full_name,username)")
      .order("created_at", { ascending: false })
      .limit(60);
    return data ?? [];
  });

/** Create or update a challenge or event. */
export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum(["challenges", "events", "announcements", "rewards"]),
        id: z.string().uuid().optional(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values = { ...data.values } as Record<string, unknown>;

    const result = data.id
      ? await supabaseAdmin.from(data.table).update(values).eq("id", data.id)
      : await supabaseAdmin.from(data.table).insert(values);
    if (result.error) throw new Error(result.error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.id ? `update_${data.table}` : `create_${data.table}`,
      target_type: data.table,
      target_id: data.id ?? null,
    });
    return { ok: true };
  });

/** Remove a challenge, event, announcement or reward. */
export const adminDeleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum(["challenges", "events", "announcements", "rewards"]),
        id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: `delete_${data.table}`,
      target_type: data.table,
      target_id: data.id,
    });
    return { ok: true };
  });
