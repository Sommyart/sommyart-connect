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

export function useSavedPostIds(userId?: string | null) {
  return useQuery({
    queryKey: ["saved-posts", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase.from("post_saves").select("post_id").eq("user_id", userId!);
      return (data ?? []).map((row) => row.post_id as string);
    },
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: async (input: { post_id: string; reporter_id: string; reason: string; details?: string }) => {
      const { error } = await supabase.from("post_reports").insert({
        post_id: input.post_id,
        reporter_id: input.reporter_id,
        reason: input.reason,
        details: input.details ?? null,
      });
      if (error && error.code !== "23505") throw error;
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });
}

export type GalleryItem = { id: string; path: string; kind: "photo" | "project" | "video"; title: string };

/** All media a member has shared, grouped for the profile gallery. */
export function useMemberMedia(userId?: string | null) {
  return useQuery({
    queryKey: ["member-media", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<GalleryItem[]> => {
      const [posts, projects] = await Promise.all([
        supabase
          .from("posts")
          .select("id,content,media_urls,media_type")
          .eq("author_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id,title,cover_url,media_urls")
          .eq("owner_id", userId!)
          .order("created_at", { ascending: false }),
      ]);

      const items: GalleryItem[] = [];
      for (const post of posts.data ?? []) {
        for (const path of (post.media_urls as string[]) ?? []) {
          items.push({
            id: `${post.id}-${path}`,
            path,
            kind: post.media_type === "video" ? "video" : "photo",
            title: (post.content as string)?.slice(0, 60) || "Post",
          });
        }
      }
      for (const project of projects.data ?? []) {
        const paths = [project.cover_url, ...((project.media_urls as string[]) ?? [])].filter(
          Boolean,
        ) as string[];
        for (const path of paths) {
          items.push({ id: `${project.id}-${path}`, path, kind: "project", title: project.title as string });
        }
      }
      return items;
    },
  });
}
