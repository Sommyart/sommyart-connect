import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const awardSchema = z.object({
  token: z.string().min(10),
  reason: z.enum(["signin", "quiz", "riddle", "ttt_ai_win", "daily_challenge"]),
  score: z.number().int().min(0).max(100).optional(),
});

export const awardPoints = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => awardSchema.parse(d))
  .handler(async ({ data }) => {
    const { memberForToken } = await import("./auth.server");
    const { addPoints, POINTS } = await import("./games.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Not signed in");

    const extra =
      data.reason === "quiz"
        ? { quizzes_played: 1, best_quiz_score: data.score ?? 0 }
        : data.reason === "riddle"
          ? { riddles_solved: 1 }
          : data.reason === "ttt_ai_win"
            ? { games_won: 1 }
            : {};

    const row = await addPoints(me, POINTS[data.reason], data.reason, extra);
    return { total_points: row.total_points };
  });

export const getMyGameProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { memberForToken } = await import("./auth.server");
    const { supabaseAdmin, tierFor } = await import("./games.server");
    const { lagosToday } = await import("./attendance.server");
    const me = await memberForToken(data.token);
    if (!me) return null;

    const [{ data: points }, { data: badges }, { data: daily }] = await Promise.all([
      supabaseAdmin.from("member_points").select("*").eq("member_id", me.id).maybeSingle(),
      supabaseAdmin.from("member_badges").select("badge,earned_at").eq("member_id", me.id),
      supabaseAdmin
        .from("daily_completions")
        .select("kind")
        .eq("member_id", me.id)
        .eq("date", lagosToday())
        .maybeSingle(),
    ]);

    const total = points?.total_points ?? 0;
    return {
      total_points: total,
      tier: tierFor(total),
      quizzes_played: points?.quizzes_played ?? 0,
      riddles_solved: points?.riddles_solved ?? 0,
      games_won: points?.games_won ?? 0,
      best_quiz_score: points?.best_quiz_score ?? 0,
      badges: (badges ?? []).map((b) => b.badge as string),
      dailyDone: Boolean(daily),
    };
  });

export const completeDailyChallenge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(10), kind: z.string().min(2).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { memberForToken } = await import("./auth.server");
    const { supabaseAdmin, addPoints, POINTS } = await import("./games.server");
    const { lagosToday } = await import("./attendance.server");
    const me = await memberForToken(data.token);
    if (!me) throw new Error("Not signed in");

    const { error } = await supabaseAdmin
      .from("daily_completions")
      .insert({ member_id: me.id, date: lagosToday(), kind: data.kind });
    if (error) throw new Error("You already completed today's challenge. Come back tomorrow!");

    const row = await addPoints(me, POINTS.daily_challenge, "daily_challenge");
    return { total_points: row.total_points };
  });
