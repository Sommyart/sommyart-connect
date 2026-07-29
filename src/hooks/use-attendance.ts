import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getAttendance, getMemberOfTheMonth, signInToday } from "@/lib/attendance.functions";
import { getToken } from "@/lib/session";

export function useAttendance(enabled = true) {
  const fetchAttendance = useServerFn(getAttendance);
  return useQuery({
    queryKey: ["attendance"],
    enabled,
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      return await fetchAttendance({ data: { token } });
    },
  });
}

export function useSignInToday() {
  const queryClient = useQueryClient();
  const signIn = useServerFn(signInToday);
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (!token) throw new Error("Not signed in");
      return await signIn({ data: { token } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useLeaderboard() {
  const fetchLeaders = useServerFn(getMemberOfTheMonth);
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => await fetchLeaders({}),
  });
}
