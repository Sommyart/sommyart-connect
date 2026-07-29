import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({ token: z.string().min(10) });

export const getAttendance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin, lagosToday, monthBounds, buildStreak } = await import(
      "./attendance.server"
    );
    const member = await memberForToken(data.token);
    if (!member) throw new Error("Not signed in");

    const today = lagosToday();
    const { start, end } = monthBounds(today);

    const [{ data: mine }, { data: monthRows }] = await Promise.all([
      supabaseAdmin
        .from("attendance")
        .select("date")
        .eq("member_id", member.id)
        .order("date", { ascending: false })
        .limit(120),
      supabaseAdmin.from("attendance").select("member_id").gte("date", start).lte("date", end),
    ]);

    const dates = (mine ?? []).map((r) => r.date as string);
    const counts = new Map<string, number>();
    for (const r of monthRows ?? [])
      counts.set(r.member_id as string, (counts.get(r.member_id as string) ?? 0) + 1);

    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const rank = ranked.findIndex(([id]) => id === member.id);

    return {
      today,
      signedInToday: dates.includes(today),
      monthCount: dates.filter((d) => d >= start && d <= end).length,
      totalCount: dates.length,
      streak: buildStreak(dates, today),
      rank: rank >= 0 ? rank + 1 : null,
      participants: ranked.length,
      dates: dates.slice(0, 45),
    };
  });

export const signInToday = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { memberForToken, supabaseAdmin, lagosToday } = await import("./attendance.server");
    const member = await memberForToken(data.token);
    if (!member) throw new Error("Not signed in");

    const today = lagosToday();
    const { error } = await supabaseAdmin
      .from("attendance")
      .insert({ member_id: member.id, date: today });
    if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    return { ok: true, date: today };
  });

export const getMemberOfTheMonth = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin, lagosToday, monthBounds } = await import("./attendance.server");
  const { start, end } = monthBounds(lagosToday());
  const { data: rows } = await supabaseAdmin
    .from("attendance")
    .select("member_id")
    .gte("date", start)
    .lte("date", end);

  const counts = new Map<string, number>();
  for (const r of rows ?? [])
    counts.set(r.member_id as string, (counts.get(r.member_id as string) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!ranked.length) return { leaders: [] as { nickname: string; days: number }[] };

  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id,nickname")
    .in(
      "id",
      ranked.map(([id]) => id),
    );
  const nameOf = new Map((members ?? []).map((m) => [m.id as string, m.nickname as string]));

  return {
    leaders: ranked.map(([id, days]) => ({ nickname: nameOf.get(id) ?? "Member", days })),
  };
});
