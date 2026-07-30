import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type BusinessPost = {
  id: string;
  member_nickname: string;
  member_image: string | null;
  business_name: string | null;
  caption: string | null;
  images: string[];
  post_date: string;
};

export function useBusinessPosts(limit = 30) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("business-posts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "business_posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["business-posts"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["business-posts", limit],
    queryFn: async (): Promise<BusinessPost[]> => {
      const { data, error } = await supabase
        .from("business_posts")
        .select("id,member_nickname,member_image,business_name,caption,images,post_date")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as BusinessPost[];
    },
  });
}
