import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type FeedAuthor = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  occupation: string | null;
};

export type Post = {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  media_type: string;
  link_url: string | null;
  created_at: string;
  profiles: FeedAuthor | null;
  post_reactions: { user_id: string; reaction: string }[];
  post_comments: { id: string }[];
};

const POST_SELECT =
  "*, profiles:author_id(id,username,full_name,avatar_url,occupation), post_reactions(user_id,reaction), post_comments(id)";

export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
    staleTime: 15_000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      author_id: string;
      content: string;
      media_urls?: string[];
      media_type?: string;
      link_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: input.author_id,
          content: input.content,
          media_urls: input.media_urls ?? [],
          media_type: input.media_type ?? "none",
          link_url: input.link_url ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, on }: { postId: string; userId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: userId, reaction: "like" });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: ["post-comments", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*, profiles:author_id(username,full_name,avatar_url)")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { post_id: string; author_id: string; body: string }) => {
      const { error } = await supabase.from("post_comments").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["post-comments", vars.post_id] });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, on }: { postId: string; userId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["saved-posts"] }),
  });
}

export function useFollow(userId?: string | null) {
  const queryClient = useQueryClient();
  const following = useQuery({
    queryKey: ["following", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId!);
      return (data ?? []).map((row) => row.following_id as string);
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ targetId, on }: { targetId: string; on: boolean }) => {
      if (!userId) throw new Error("Sign in to follow creators");
      if (on) {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: userId, following_id: targetId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", targetId);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["following"] }),
  });

  return { following: following.data ?? [], toggle };
}
