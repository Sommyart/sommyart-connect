import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getCheckInStats, signInToday } from "@/lib/checkin.functions";

export type CheckInStats = {
  today: string;
  dates: string[];
  total: number;
  monthly: number;
  currentStreak: number;
  longestStreak: number;
  signedToday: boolean;
};

export function useCheckInStats(enabled = true) {
  const fetchStats = useServerFn(getCheckInStats);
  return useQuery({
    queryKey: ["check-in-stats"],
    enabled,
    queryFn: async () => (await fetchStats()) as CheckInStats,
    staleTime: 60_000,
  });
}

export function useSignInToday() {
  const queryClient = useQueryClient();
  const run = useServerFn(signInToday);
  return useMutation({
    mutationFn: async () => run(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["check-in-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["community-leaderboard"] });
    },
  });
}
