import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Called once per app open: keeps the streak counter accurate. */
export const checkIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { touchStreak } = await import("./points.server");
    return { streak: await touchStreak(context.userId) };
  });

const awardSchema = z.object({
  reason: z.enum([
    "start_discussion",
    "complete_challenge",
    "help_member",
    "win_weekly_challenge",
    "host_session",
  ]),
  refId: z.string().uuid().optional(),
});

/** Award the caller points for a verified community action. */
export const awardForAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => awardSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { award, supabaseAdmin } = await import("./points.server");
    const userId = context.userId;

    // Verify the action really happened before paying out.
    if (data.reason === "start_discussion") {
      const { count } = await supabaseAdmin
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("id", data.refId ?? "")
        .eq("author_id", userId);
      if (!count) throw new Error("Post not found");
      const { count: paid } = await supabaseAdmin
        .from("points_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("reason", "start_discussion")
        .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
      if ((paid ?? 0) >= 3) return { awarded: 0 };
    }

    if (data.reason === "complete_challenge") {
      const { count } = await supabaseAdmin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("id", data.refId ?? "")
        .eq("author_id", userId);
      if (!count) throw new Error("Submission not found");
    }

    if (data.reason === "help_member") {
      const { count } = await supabaseAdmin
        .from("submission_feedback")
        .select("id", { count: "exact", head: true })
        .eq("author_id", userId);
      // Participation rule: two quality reviews earn the helper points.
      if ((count ?? 0) % 2 !== 0) return { awarded: 0 };
    }

    if (data.reason === "win_weekly_challenge" || data.reason === "host_session") {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Only admins can award this");
    }

    const result = await award(userId, data.reason);
    return { awarded: result ? true : false };
  });

/** Admin-only: grant points to any member. */
export const grantPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ userId: z.string().uuid(), points: z.number().int().min(-1000).max(1000), reason: z.string().min(2).max(80) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { award, notify } = await import("./points.server");
    await award(data.userId, data.reason, data.points);
    await notify(data.userId, `You earned ${data.points} points`, data.reason, "points");
    return { ok: true };
  });

/** Spend points on a reward from the catalogue. */
export const redeemReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rewardId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, notify } = await import("./points.server");
    const userId = context.userId;

    const [{ data: reward }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("rewards").select("*").eq("id", data.rewardId).maybeSingle(),
      supabaseAdmin.from("profiles").select("points").eq("id", userId).maybeSingle(),
    ]);
    if (!reward || !reward.is_active) throw new Error("Reward unavailable");
    if ((profile?.points ?? 0) < reward.cost) throw new Error("Not enough points yet");

    await supabaseAdmin
      .from("redemptions")
      .insert({ reward_id: reward.id, user_id: userId, cost: reward.cost });
    await supabaseAdmin
      .from("profiles")
      .update({ points: (profile?.points ?? 0) - reward.cost })
      .eq("id", userId);
    await supabaseAdmin
      .from("points_log")
      .insert({ user_id: userId, points: -reward.cost, reason: `redeem:${reward.title}` });
    await notify(userId, "Redemption received", `${reward.title} — pending approval`, "reward");

    return { ok: true, remaining: (profile?.points ?? 0) - reward.cost };
  });
