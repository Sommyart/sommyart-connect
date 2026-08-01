import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { awardPoints, completeDailyChallenge, getMyGameProfile } from "@/lib/games.functions";
import { getToken } from "@/lib/session";

export type QuizQuestion = {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  answer_index: number;
};

export type Riddle = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type LeaderRow = {
  member_id: string;
  nickname: string;
  profile_picture: string | null;
  total_points: number;
  quizzes_played: number;
  featured: boolean;
};

export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function useQuizQuestions(difficulty: string) {
  return useQuery({
    queryKey: ["quiz-questions", difficulty],
    queryFn: async (): Promise<QuizQuestion[]> => {
      let q = supabase
        .from("quiz_questions")
        .select("id,category,difficulty,question,options,answer_index")
        .eq("is_active", true);
      if (difficulty !== "any") q = q.eq("difficulty", difficulty);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as QuizQuestion[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useRiddles(category: string) {
  return useQuery({
    queryKey: ["riddles", category],
    queryFn: async (): Promise<Riddle[]> => {
      let q = supabase.from("riddles").select("id,category,question,answer").eq("is_active", true);
      if (category !== "any") q = q.eq("category", category);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return (data ?? []) as Riddle[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLeaderboard(limit = 25) {
  return useQuery({
    queryKey: ["leaderboard", limit],
    queryFn: async (): Promise<LeaderRow[]> => {
      const { data, error } = await supabase
        .from("member_points")
        .select("member_id,nickname,profile_picture,total_points,quizzes_played,featured")
        .order("total_points", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
    staleTime: 30_000,
  });
}

export function useGameProfile() {
  const fn = useServerFn(getMyGameProfile);
  return useQuery({
    queryKey: ["game-profile"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      return await fn({ data: { token } });
    },
    staleTime: 30_000,
  });
}

export function useAwardPoints() {
  const fn = useServerFn(awardPoints);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      reason: "quiz" | "riddle" | "ttt_ai_win" | "signin" | "daily_challenge";
      score?: number;
    }) => {
      const token = getToken();
      if (!token) return null;
      return await fn({ data: { token, ...input } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDailyChallenge() {
  const fn = useServerFn(completeDailyChallenge);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kind: string) => {
      const token = getToken();
      if (!token) throw new Error("Please log in first");
      return await fn({ data: { token, kind } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
