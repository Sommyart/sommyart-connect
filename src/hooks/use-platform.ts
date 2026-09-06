import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { redeemReward } from "@/lib/community.functions";

export type LeaderScope = "weekly_points" | "monthly_points" | "points";

export function useLeaderboard(scope: LeaderScope = "points", limit = 25) {
  return useQuery({
    queryKey: ["community-leaderboard", scope, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,occupation,points,weekly_points,monthly_points,streak")
        .order(scope, { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const [members, projects, posts, submissions] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }),
      ]);
      return {
        members: members.count ?? 0,
        projects: projects.count ?? 0,
        posts: posts.count ?? 0,
        submissions: submissions.count ?? 0,
      };
    },
    staleTime: 60_000,
  });
}

export function useRewards() {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .order("cost", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useRedeem() {
  const fn = useServerFn(redeemReward);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => await fn({ data: { rewardId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["redemptions"] });
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
