import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { QUIZ_BANK, shuffle, type QuizQuestion } from "@/lib/games";

export type QuizFilters = { category: string; difficulty: string; count: number; mode: "practice" | "timed" };

/** Distinct active categories available in the quiz bank, for the setup screen. */
export function useQuizCategories() {
  return useQuery({
    queryKey: ["quiz-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_questions").select("category").eq("is_active", true);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.category))].sort();
    },
    staleTime: 60_000,
  });
}

/** Loads quiz questions matching the filters, falling back to the local bank when short. */
export function useQuizBank(filters: QuizFilters, enabled = true) {
  return useQuery({
    queryKey: ["quiz-bank", filters],
    enabled,
    queryFn: async (): Promise<QuizQuestion[]> => {
      let query = supabase.from("quiz_questions").select("category,difficulty,question,options,answer").eq("is_active", true);
      if (filters.category !== "All") query = query.eq("category", filters.category);
      if (filters.difficulty !== "Any") query = query.eq("difficulty", filters.difficulty.toLowerCase());

      const { data, error } = await query.limit(200);
      if (error) throw error;

      const fromDb: QuizQuestion[] = (data ?? []).map((row) => ({
        q: row.question,
        options: row.options as unknown as string[],
        answer: row.answer,
        category: row.category,
      }));

      if (fromDb.length >= filters.count) return shuffle(fromDb).slice(0, filters.count);

      const fallback = filters.category === "All" ? QUIZ_BANK : QUIZ_BANK.filter((q) => q.category === filters.category);
      const pool = fromDb.length ? [...fromDb, ...fallback] : fallback.length ? fallback : QUIZ_BANK;
      return shuffle(pool).slice(0, filters.count);
    },
    staleTime: 10_000,
  });
}
