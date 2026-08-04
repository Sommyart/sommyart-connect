import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LAGOS = "Africa/Lagos";

/** Today's calendar date in the community timezone (YYYY-MM-DD). */
export function lagosDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS }).format(d);
}

export const DAILY_POINTS = 5;

/** Bonus points earned when a streak reaches a milestone. */
export function bonusFor(streak: number): { points: number; label: string } | null {
  if (streak > 0 && streak % 100 === 0) return { points: 250, label: "100-day Community Legend badge" };
  if (streak > 0 && streak % 30 === 0) return { points: 100, label: "30-day streak bonus" };
  if (streak > 0 && streak % 7 === 0) return { points: 20, label: "7-day streak bonus" };
  return null;
}

export async function signIn(userId: string) {
  const today = lagosDate();
  const yesterday = lagosDate(-1);

  const { data: existing } = await supabaseAdmin
    .from("check_ins")
    .select("id,streak_after")
    .eq("user_id", userId)
    .eq("check_date", today)
    .maybeSingle();

  if (existing) {
    return { already: true, streak: existing.streak_after, points: 0, bonus: null as null | string };
  }

  const { data: last } = await supabaseAdmin
    .from("check_ins")
    .select("check_date,streak_after")
    .eq("user_id", userId)
    .order("check_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const streak = last?.check_date === yesterday ? (last.streak_after ?? 0) + 1 : 1;
  const bonus = bonusFor(streak);
  const total = DAILY_POINTS + (bonus?.points ?? 0);

  await supabaseAdmin.from("check_ins").insert({
    user_id: userId,
    check_date: today,
    points_awarded: DAILY_POINTS,
    bonus_awarded: bonus?.points ?? 0,
    streak_after: streak,
  });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("points,weekly_points,monthly_points,longest_streak")
    .eq("id", userId)
    .maybeSingle();

  await supabaseAdmin.from("points_log").insert({
    user_id: userId,
    points: total,
    reason: bonus ? `daily_signin+${bonus.label}` : "daily_signin",
  });

  await supabaseAdmin
    .from("profiles")
    .update({
      streak,
      last_active_date: today,
      longest_streak: Math.max(profile?.longest_streak ?? 0, streak),
      points: (profile?.points ?? 0) + total,
      weekly_points: (profile?.weekly_points ?? 0) + total,
      monthly_points: (profile?.monthly_points ?? 0) + total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (bonus) {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `${bonus.label} unlocked`,
      body: `You earned ${bonus.points} bonus points for a ${streak}-day streak.`,
      kind: "points",
    });
  }

  return { already: false, streak, points: total, bonus: bonus?.label ?? null };
}

export async function stats(userId: string) {
  const { data: rows } = await supabaseAdmin
    .from("check_ins")
    .select("check_date,streak_after")
    .eq("user_id", userId)
    .order("check_date", { ascending: false })
    .limit(400);

  const dates = (rows ?? []).map((r) => r.check_date);
  const today = lagosDate();
  const month = today.slice(0, 7);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("streak,longest_streak")
    .eq("id", userId)
    .maybeSingle();

  const current = dates[0] === today || dates[0] === lagosDate(-1) ? (profile?.streak ?? 0) : 0;

  return {
    today,
    dates,
    total: dates.length,
    monthly: dates.filter((d) => d.startsWith(month)).length,
    currentStreak: current,
    longestStreak: profile?.longest_streak ?? 0,
    signedToday: dates.includes(today),
  };
}
