import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const POINTS = {
  signin: 5,
  quiz: 10,
  riddle: 5,
  ttt_ai_win: 8,
  streak_bonus: 10,
  daily_challenge: 15,
} as const;

export type PointReason = keyof typeof POINTS;

export const TIERS = [
  { badge: "Community Legend", emoji: "👑", min: 1500 },
  { badge: "Platinum Member", emoji: "💎", min: 700 },
  { badge: "Gold Member", emoji: "🥇", min: 300 },
  { badge: "Silver Member", emoji: "🥈", min: 100 },
  { badge: "Bronze Member", emoji: "🥉", min: 0 },
];

export function tierFor(points: number) {
  return TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1]!;
}

export async function grantBadge(memberId: string, badge: string) {
  await supabaseAdmin.from("member_badges").insert({ member_id: memberId, badge });
}

type Extra = {
  quizzes_played?: number;
  riddles_solved?: number;
  games_won?: number;
  best_quiz_score?: number;
};

export async function addPoints(
  member: { id: string; nickname: string; profile_picture: string | null },
  points: number,
  reason: string,
  extra: Extra = {},
) {
  const { data: row } = await supabaseAdmin
    .from("member_points")
    .select("*")
    .eq("member_id", member.id)
    .maybeSingle();

  const current = row ?? {
    total_points: 0,
    quizzes_played: 0,
    riddles_solved: 0,
    games_won: 0,
    best_quiz_score: 0,
  };

  const next = {
    member_id: member.id,
    nickname: member.nickname,
    profile_picture: member.profile_picture,
    total_points: (current.total_points ?? 0) + points,
    quizzes_played: (current.quizzes_played ?? 0) + (extra.quizzes_played ?? 0),
    riddles_solved: (current.riddles_solved ?? 0) + (extra.riddles_solved ?? 0),
    games_won: (current.games_won ?? 0) + (extra.games_won ?? 0),
    best_quiz_score: Math.max(current.best_quiz_score ?? 0, extra.best_quiz_score ?? 0),
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin.from("member_points").upsert(next, { onConflict: "member_id" });
  if (points !== 0) {
    await supabaseAdmin
      .from("points_ledger")
      .insert({ member_id: member.id, points, reason });
  }

  // milestone badges
  const badges: string[] = [tierFor(next.total_points).badge];
  if (next.quizzes_played >= 1) badges.push("First Quiz Completed");
  if (next.quizzes_played >= 10) badges.push("Quiz Master");
  if (next.riddles_solved >= 15) badges.push("Riddle Genius");
  if (next.games_won >= 10) badges.push("Tic Tac Toe Champion");
  for (const badge of badges) await grantBadge(member.id, badge);

  return next;
}

export { supabaseAdmin };
