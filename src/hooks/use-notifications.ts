import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type NotificationFilter = "all" | "unread" | "post" | "mention" | "comment" | "like" | "follow";

/** Notification feed for the signed-in member, kept live over realtime. */
export function useNotifications(userId?: string | null) {
  const queryClient = useQueryClient();
  const channelId = useRef(crypto.randomUUID());

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
      .eq("user_id", userId ?? "")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
     staleTime: 10_000,
     refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}-${channelId.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [userId, queryClient]);

  return query;
}

export function useUnreadCount(userId?: string | null) {
  const { data = [] } = useNotifications(userId);
  return data.filter((n) => !n.is_read).length;
}

export function useMarkNotifications(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ids?: string[]; all?: boolean }) => {
      if (!userId) return;
      let request = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
      if (!input.all && input.ids?.length) request = request.in("id", input.ids);
      const { error } = await request;
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useClearNotifications(userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

/** Groups notifications by calendar day for the notification centre. */
export function groupByDay(items: AppNotification[]) {
  const groups = new Map<string, AppNotification[]>();
  for (const item of items) {
    const date = new Date(item.created_at);
    const today = new Date();
    const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(item.created_at).setHours(0, 0, 0, 0)) / 86_400_000);
    const label =
      diffDays === 0
        ? "Today"
        : diffDays === 1
          ? "Yesterday"
          : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups.entries()];
}
