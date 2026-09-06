import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  game: z.enum([
    "quiz",
    "tictactoe",
    "toolguess",
    "riddle",
    "promptbattle",
    "typing",
    "code",
    "logic",
    "trivia",
  ]),
  score: z.number().int().min(0).max(100),
  won: z.boolean().optional(),
});

const REWARD = {
  quiz: 10,
  tictactoe: 8,
  toolguess: 6,
  riddle: 5,
  promptbattle: 8,
  typing: 6,
  code: 8,
  logic: 6,
  trivia: 10,
} as const;

/** Daily payout limit per game so points stay meaningful. */
const DAILY_AWARDS = {
  quiz: 1,
  tictactoe: 3,
  toolguess: 2,
  riddle: 1,
  promptbattle: 1,
  typing: 2,
  code: 2,
  logic: 2,
  trivia: 1,
} as const;

/** Whether a finished round is good enough to be paid, per game. */
function qualifies(game: keyof typeof REWARD, score: number, won?: boolean) {
  switch (game) {
    case "quiz":
    case "trivia":
      return score >= 7;
    case "riddle":
      return true;
    case "promptbattle":
      return score >= 60;
    case "typing":
      return score >= 40;
    case "code":
      return score >= 7;
    case "logic":
      return score >= 4;
    default:
      return Boolean(won);
  }
}

/** Record a finished game and award points within the daily limits. */
export const recordGameScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { award, supabaseAdmin } = await import("./points.server");
    const userId = context.userId;

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);

    const { data: today } = await supabaseAdmin
      .from("game_scores")
      .select("id,points_awarded")
      .eq("user_id", userId)
      .eq("game", data.game)
      .gte("created_at", since.toISOString());

    const paidToday = (today ?? []).filter((row) => (row.points_awarded ?? 0) > 0).length;
    const points =
      qualifies(data.game, data.score, data.won) && paidToday < DAILY_AWARDS[data.game] ? REWARD[data.game] : 0;

    await supabaseAdmin.from("game_scores").insert({
      user_id: userId,
      game: data.game,
      score: data.score,
      points_awarded: points,
    });

    if (points) await award(userId, `game:${data.game}`, points);

    return { points, plays: (today?.length ?? 0) + 1 };
  });
