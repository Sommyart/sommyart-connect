import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { POINT_RULES, type PointReason } from "./points";

function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

function startOfWeek(): string {
  const now = new Date();
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Award points to a member, log the reason and refresh their rollups. */
export async function award(userId: string, reason: PointReason | string, points?: number) {
  const value = points ?? POINT_RULES[reason as PointReason] ?? 0;
  if (!value) return null;

  await supabaseAdmin.from("points_log").insert({ user_id: userId, points: value, reason });

  const [{ data: weekRows }, { data: monthRows }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("points_log").select("points").eq("user_id", userId).gte("created_at", startOfWeek()),
    supabaseAdmin.from("points_log").select("points").eq("user_id", userId).gte("created_at", startOfMonth()),
    supabaseAdmin.from("profiles").select("points").eq("id", userId).maybeSingle(),
  ]);

  const sum = (rows: { points: number }[] | null) =>
    (rows ?? []).reduce((total, row) => total + row.points, 0);

  const next = {
    points: (profile?.points ?? 0) + value,
    weekly_points: sum(weekRows),
    monthly_points: sum(monthRows),
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("profiles").update(next).eq("id", userId);
  return next;
}

/** Record a daily visit and keep the streak counter accurate. */
export async function touchStreak(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("streak,last_active_date")
    .eq("id", userId)
    .maybeSingle();

  const today = lagosToday();
  if (!profile || profile.last_active_date === today) return profile?.streak ?? 0;

  const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date(Date.now() - 86_400_000),
  );
  const streak = profile.last_active_date === yesterday ? (profile.streak ?? 0) + 1 : 1;

  await supabaseAdmin
    .from("profiles")
    .update({ streak, last_active_date: today })
    .eq("id", userId);
  return streak;
}

export async function notify(userId: string, title: string, body = "", kind = "general", link?: string) {
  await supabaseAdmin.from("notifications").insert({ user_id: userId, title, body, kind, link: link ?? null });
}

export { supabaseAdmin };
