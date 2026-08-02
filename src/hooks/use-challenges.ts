import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Challenge = {
  id: string;
  kind: string;
  day_of_week: number | null;
  track: string | null;
  title: string;
  description: string;
  prompt: string | null;
  ai_tool: string | null;
  is_active: boolean;
  created_at: string;
};

export type Submission = {
  id: string;
  challenge_id: string | null;
  track: string;
  author_id: string;
  title: string;
  body: string;
  media_urls: string[];
  link_url: string | null;
  featured: boolean;
  created_at: string;
  profiles: { id: string; username: string; full_name: string; avatar_url: string | null } | null;
  submission_feedback: { id: string; author_id: string; liked: string; improvement: string }[];
  votes: { category: string; voter_id: string }[];
};

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
    staleTime: 60_000,
  });
}

export function useSubmissions(track?: string) {
  return useQuery({
    queryKey: ["submissions", track ?? "all"],
    queryFn: async (): Promise<Submission[]> => {
      let query = supabase
        .from("submissions")
        .select(
          "*, profiles:author_id(id,username,full_name,avatar_url), submission_feedback(id,author_id,liked,improvement), votes(category,voter_id)",
        )
        .order("created_at", { ascending: false });
      if (track) query = query.eq("track", track);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as Submission[];
    },
    staleTime: 15_000,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      author_id: string;
      track: string;
      challenge_id?: string | null;
      title: string;
      body: string;
      media_urls?: string[];
      link_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("submissions")
        .insert({
          author_id: input.author_id,
          track: input.track,
          challenge_id: input.challenge_id ?? null,
          title: input.title,
          body: input.body,
          media_urls: input.media_urls ?? [],
          link_url: input.link_url ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export function useGiveFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      submission_id: string;
      author_id: string;
      liked: string;
      improvement: string;
    }) => {
      if (input.liked.trim().length < 10 || input.improvement.trim().length < 10)
        throw new Error("Feedback must be specific — 'Nice' doesn't count");
      const { error } = await supabase.from("submission_feedback").insert(input);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      submission_id: string;
      challenge_id: string | null;
      voter_id: string;
      category: string;
    }) => {
      await supabase
        .from("votes")
        .delete()
        .eq("voter_id", input.voter_id)
        .eq("category", input.category)
        .eq("challenge_id", input.challenge_id ?? "");
      const { error } = await supabase.from("votes").insert(input);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export function useLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, lesson_rsvps(user_id)")
        .order("scheduled_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, userId, on }: { lessonId: string; userId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("lesson_rsvps").insert({ lesson_id: lessonId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("lesson_rsvps")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("week_of_month", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}
