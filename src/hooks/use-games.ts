import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { recordGameScore } from "@/lib/games.functions";
import type { GameKey } from "@/lib/games";

export type ScoreRow = {
  user_id: string;
  score: number;
  points_awarded: number;
  created_at: string;
  profiles: { full_name: string; username: string; avatar_url: string | null } | null;
};

/** Top 10 for one game, best score per member. */
export function useGameLeaderboard(game: GameKey) {
  return useQuery({
    queryKey: ["game-leaderboard", game],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_scores")
        .select("user_id,score,points_awarded,created_at,profiles:user_id(full_name,username,avatar_url)")
        .eq("game", game)
        .order("score", { ascending: false })
        .limit(120);
      if (error) throw error;

      const best = new Map<string, ScoreRow>();
      for (const row of (data ?? []) as unknown as ScoreRow[]) {
        const current = best.get(row.user_id);
        if (!current || row.score > current.score) best.set(row.user_id, row);
      }
      return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    },
    staleTime: 20_000,
  });
}

export function useMyGameStats(userId?: string | null) {
  return useQuery({
    queryKey: ["my-game-stats", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("game_scores")
        .select("game,score,points_awarded")
        .eq("user_id", userId!);
      const rows = data ?? [];
      return {
        plays: rows.length,
        xp: rows.reduce((total, row) => total + (row.score ?? 0), 0),
        earned: rows.reduce((total, row) => total + (row.points_awarded ?? 0), 0),
        best: rows.reduce<Record<string, number>>((acc, row) => {
          acc[row.game as string] = Math.max(acc[row.game as string] ?? 0, row.score ?? 0);
          return acc;
        }, {}),
      };
    },
  });
}

export function useRecordScore() {
  const record = useServerFn(recordGameScore);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { game: GameKey; score: number; won?: boolean }) => record({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["my-game-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
