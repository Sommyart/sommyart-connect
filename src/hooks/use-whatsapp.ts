import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getMyConsent, recordConsent, recordJoinClick } from "@/lib/whatsapp.functions";
import { getToken } from "@/lib/session";

export function useWhatsappConsent() {
  const fn = useServerFn(getMyConsent);
  return useQuery({
    queryKey: ["whatsapp-consent"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      return await fn({ data: { token } });
    },
    staleTime: 30_000,
  });
}

export function useRecordConsent() {
  const fn = useServerFn(recordConsent);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accepted: boolean) => {
      const token = getToken();
      if (!token) throw new Error("Please log in first");
      return await fn({
        data: {
          token,
          accepted,
          device: typeof navigator === "undefined" ? undefined : navigator.userAgent.slice(0, 280),
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whatsapp-consent"] }),
  });
}

export function useRecordJoinClick() {
  const fn = useServerFn(recordJoinClick);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      if (!token) return null;
      return await fn({ data: { token } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whatsapp-consent"] }),
  });
}
