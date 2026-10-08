import { useEffect, useId, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

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
  otherDeliveredAt: string | null;
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

function previewOf(m: Pick<Message, "body" | "media_urls">) {
  return m.body ? m.body.slice(0, 140) : m.media_urls?.length ? "Photo" : "";
}

/** Instantly move a conversation to the top of every cached inbox with the new preview/time. */
export function patchInbox(queryClient: QueryClient, m: Message, myId?: string | null) {
  queryClient.setQueriesData<ConversationRow[]>({ queryKey: ["conversations"] }, (old) => {
    if (!old) return old;
    const hit = old.find((c) => c.id === m.conversation_id);
    if (!hit) return old;
    const next: ConversationRow = {
      ...hit,
      last_message_at: m.created_at,
      last_message_preview: previewOf(m),
      last_sender_id: m.sender_id,
      unread: myId && m.sender_id !== myId && m.kind !== "system" ? hit.unread + 1 : hit.unread,
    };
    return [next, ...old.filter((c) => c.id !== m.conversation_id)];
  });
}

export function useConversations(userId?: string | null) {
  return useQuery({
    queryKey: ["conversations", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ConversationRow[]> => {
      void supabase.rpc("mark_messages_delivered");
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
          .select("conversation_id, last_read_at, last_delivered_at, profiles:user_id(id,username,full_name,avatar_url)")
          .in("conversation_id", ids)
          .neq("user_id", userId!),
        supabase.rpc("my_unread_counts"),
      ]);
      const unreadMap = new Map((unread.data ?? []).map((u) => [u.conversation_id, Number(u.unread)]));
      const otherMap = new Map(
        (others.data ?? []).map((o) => [o.conversation_id, o as unknown as { last_read_at: string; last_delivered_at: string; profiles: MiniProfile | null }]),
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
          otherDeliveredAt: otherMap.get(c.id)?.last_delivered_at ?? null,
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        if (m?.conversation_id) patchInbox(queryClient, m, userId);
        if (m?.sender_id !== userId) void supabase.rpc("mark_messages_delivered");
        void queryClient.invalidateQueries({ queryKey: ["dm-unread"] });
        setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["conversations"] }), 400);
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
      const { data, error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: body.trim().slice(0, 4000),
        media_urls: media,
        reply_to: replyTo ?? null,
      }).select("*").single();
      if (error) throw new Error(error.code === "42501" ? "You can't message this member" : error.message);
      return data as Message;
    },
    onSuccess: (m) => {
      if (m) patchInbox(queryClient, m, userId);
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

export const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏"] as const;
export type Reaction = { id: string; message_id: string; user_id: string; emoji: string };

export function useReactions(conversationId: string, userId?: string | null) {
  const queryClient = useQueryClient();
  const channelId = useId();
  const query = useQuery({
    queryKey: ["dm-reactions", conversationId],
    queryFn: async (): Promise<Reaction[]> => {
      const { data } = await supabase.from("message_reactions").select("id,message_id,user_id,emoji").eq("conversation_id", conversationId);
      return (data ?? []) as Reaction[];
    },
  });
  useEffect(() => {
    const channel = supabase
      .channel(`dm-react-${conversationId}-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions", filter: `conversation_id=eq.${conversationId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["dm-reactions", conversationId] }))
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [conversationId, channelId, queryClient]);
  async function react(messageId: string, emoji: string) {
    if (!userId) return;
    const mine = (query.data ?? []).find((r) => r.message_id === messageId && r.user_id === userId);
    if (mine?.emoji === emoji) await supabase.from("message_reactions").delete().eq("id", mine.id);
    else await supabase.from("message_reactions").upsert({ message_id: messageId, conversation_id: conversationId, user_id: userId, emoji }, { onConflict: "message_id,user_id" });
    void queryClient.invalidateQueries({ queryKey: ["dm-reactions", conversationId] });
  }
  return { reactions: query.data ?? [], react };
}

/** Realtime "is typing" signal via a broadcast channel (nothing is stored). */
export function useTyping(conversationId: string, userId?: string | null) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSent = useRef(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`typing-${conversationId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === userId) return;
        setOtherTyping(Boolean(payload?.typing));
        clearTimeout(timer);
        if (payload?.typing) timer = setTimeout(() => setOtherTyping(false), 4000);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { clearTimeout(timer); void supabase.removeChannel(channel); channelRef.current = null; };
  }, [conversationId, userId]);
  function ping(typing = true) {
    const now = Date.now();
    if (typing && now - lastSent.current < 2000) return;
    lastSent.current = typing ? now : 0;
    void channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId, typing } });
  }
  return { otherTyping, ping };
}

export function useMemberSearch(term: string) {
  return useQuery({
    queryKey: ["member-search", term],
    queryFn: async (): Promise<MiniProfile[]> => {
      const { data } = await supabase.rpc("search_members", { _q: term });
      return (data ?? []) as MiniProfile[];
    },
    staleTime: 30_000,
  });
}
