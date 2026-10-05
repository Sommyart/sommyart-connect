import { useEffect, useId } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { compressImage, validateImageFile } from "@/lib/image";

export type MiniProfile = { id: string; username: string; full_name: string; avatar_url: string | null };

export type ConversationRow = {
  id: string;
  last_message_at: string;
  last_message_preview: string | null;
  last_sender_id: string | null;
  muted: boolean;
  other: MiniProfile | null;
  otherLastReadAt: string | null;
  unread: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  media_urls: string[];
  reply_to: string | null;
  kind: string;
  deleted_at: string | null;
  created_at: string;
};

const PAGE = 30;

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: ["conversations", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ConversationRow[]> => {
      const { data: mine, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id, muted, deleted_at")
        .eq("user_id", userId!)
        .is("deleted_at", null);
      if (error) throw error;
      const ids = (mine ?? []).map((r) => r.conversation_id);
      if (!ids.length) return [];
      const [convs, others, unread] = await Promise.all([
        supabase.from("conversations").select("*").in("id", ids),
        supabase
          .from("conversation_participants")
          .select("conversation_id, last_read_at, profiles:user_id(id,username,full_name,avatar_url)")
          .in("conversation_id", ids)
          .neq("user_id", userId!),
        supabase.rpc("my_unread_counts"),
      ]);
      const unreadMap = new Map((unread.data ?? []).map((u) => [u.conversation_id, Number(u.unread)]));
      const otherMap = new Map(
        (others.data ?? []).map((o) => [o.conversation_id, o as unknown as { last_read_at: string; profiles: MiniProfile | null }]),
      );
      const mutedMap = new Map((mine ?? []).map((m) => [m.conversation_id, m.muted]));
      return (convs.data ?? [])
        .map((c) => ({
          id: c.id,
          last_message_at: c.last_message_at,
          last_message_preview: c.last_message_preview,
          last_sender_id: c.last_sender_id,
          muted: mutedMap.get(c.id) ?? false,
          other: otherMap.get(c.id)?.profiles ?? null,
          otherLastReadAt: otherMap.get(c.id)?.last_read_at ?? null,
          unread: unreadMap.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
    },
  });
}

export function useUnreadMessages(userId?: string | null) {
  const queryClient = useQueryClient();
  const channelId = useId();
  const query = useQuery({
    queryKey: ["dm-unread", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.rpc("my_unread_counts");
      return (data ?? []).reduce((sum, r) => sum + Number(r.unread), 0);
    },
  });
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`dm-unread-${userId}-${channelId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["dm-unread"] });
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [userId, channelId, queryClient]);
  return query.data ?? 0;
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const channelId = useId();
  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<Message[]> => {
      let q = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (pageParam) q = q.lt("created_at", pageParam);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].created_at : null),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`dm-${conversationId}-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_participants", filter: `conversation_id=eq.${conversationId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [conversationId, channelId, queryClient]);

  const messages = (query.data?.pages ?? []).flat().slice().reverse();
  return { ...query, messages };
}

export function useSendMessage(conversationId: string, userId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, file, replyTo }: { body: string; file?: File | null; replyTo?: string | null }) => {
      if (!userId) throw new Error("Sign in to send messages");
      const media: string[] = [];
      if (file) {
        const problem = validateImageFile(file);
        if (problem) throw new Error(problem);
        const blob = await compressImage(file);
        const path = `${conversationId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("dm-media").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        media.push(path);
      }
      if (!body.trim() && !media.length) return;
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: body.trim().slice(0, 4000),
        media_urls: media,
        reply_to: replyTo ?? null,
      });
      if (error) throw new Error(error.code === "42501" ? "You can't message this member" : error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

const dmCache = new Map<string, string>();
export async function dmMediaUrl(path: string) {
  const hit = dmCache.get(path);
  if (hit) return hit;
  const { data } = await supabase.storage.from("dm-media").createSignedUrl(path, 3600);
  if (data?.signedUrl) dmCache.set(path, data.signedUrl);
  return data?.signedUrl ?? null;
}

export async function startConversation(otherId: string) {
  const { data, error } = await supabase.rpc("start_conversation", { _other: otherId });
  if (error) throw new Error(error.message);
  return data as string;
}

export function useBlocks(userId?: string | null) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["blocks", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("blocked_id, profiles:blocked_id(id,username,full_name,avatar_url)")
        .eq("blocker_id", userId!);
      return (data ?? []) as unknown as { blocked_id: string; profiles: MiniProfile | null }[];
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ targetId, block }: { targetId: string; block: boolean }) => {
      if (!userId) return;
      const res = block
        ? await supabase.from("blocked_users").insert({ blocker_id: userId, blocked_id: targetId })
        : await supabase.from("blocked_users").delete().eq("blocker_id", userId).eq("blocked_id", targetId);
      if (res.error && res.error.code !== "23505") throw res.error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blocks"] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  return { blocked: query.data ?? [], ids: new Set((query.data ?? []).map((b) => b.blocked_id)), toggle };
}

export function usePendingCollabs(userId?: string | null) {
  return useQuery({
    queryKey: ["collabs", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("collaboration_requests")
        .select("*, profiles:sender_id(id,username,full_name,avatar_url)")
        .eq("recipient_id", userId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as {
        id: string;
        category: string;
        topic: string;
        message: string;
        created_at: string;
        profiles: MiniProfile | null;
      }[];
    },
  });
}
