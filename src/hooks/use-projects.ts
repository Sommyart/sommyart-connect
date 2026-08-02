import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Project = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  media_urls: string[];
  link_url: string | null;
  download_url: string | null;
  technologies: string[];
  views: number;
  downloads: number;
  featured: boolean;
  created_at: string;
  profiles: { id: string; username: string; full_name: string; avatar_url: string | null } | null;
  project_likes: { user_id: string }[];
  project_comments: { id: string }[];
};

const SELECT =
  "*, profiles:owner_id(id,username,full_name,avatar_url), project_likes(user_id), project_comments(id)";

export function useProjects(ownerId?: string) {
  return useQuery({
    queryKey: ["projects", ownerId ?? "all"],
    queryFn: async (): Promise<Project[]> => {
      let query = supabase.from("projects").select(SELECT).order("created_at", { ascending: false });
      if (ownerId) query = query.eq("owner_id", ownerId);
      const { data, error } = await query.limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
    staleTime: 30_000,
  });
}

export function useFeaturedProject() {
  return useQuery({
    queryKey: ["featured-project"],
    queryFn: async (): Promise<Project | null> => {
      const { data } = await supabase
        .from("projects")
        .select(SELECT)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as unknown as Project) ?? null;
    },
    staleTime: 60_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      owner_id: string;
      title: string;
      description: string;
      cover_url?: string | null;
      link_url?: string | null;
      technologies?: string[];
    }) => {
      const { error } = await supabase.from("projects").insert({
        owner_id: input.owner_id,
        title: input.title,
        description: input.description,
        cover_url: input.cover_url ?? null,
        link_url: input.link_url ?? null,
        technologies: input.technologies ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useToggleProjectLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId, on }: { projectId: string; userId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase
          .from("project_likes")
          .insert({ project_id: projectId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("project_id", projectId)
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
