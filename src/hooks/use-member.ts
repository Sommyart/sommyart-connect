import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { getMe, logoutMember } from "@/lib/auth.functions";
import { clearToken, getToken } from "@/lib/session";
import type { PublicMember } from "@/lib/member-types";

export function useMember() {
  const me = useServerFn(getMe);
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<PublicMember | null> => {
      const token = getToken();
      if (!token) return null;
      const res = await me({ data: { token } });
      return (res.member as PublicMember | null) ?? null;
    },
    staleTime: 60_000,
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useServerFn(logoutMember);

  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (token) await logout({ data: { token } });
    },
    onSettled: async () => {
      clearToken();
      await queryClient.cancelQueries();
      queryClient.clear();
      navigate({ to: "/login", replace: true });
    },
  });
}
