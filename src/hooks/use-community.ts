import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Activity, Winner } from "@/lib/member-types";

export function useActivities() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("activities-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => {
        queryClient.invalidateQueries({ queryKey: ["activities"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["activities"],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("id,day,title,description,image,is_active")
        .order("day");
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });
}

export function useWinners() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("winners-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "winners" }, () => {
        queryClient.invalidateQueries({ queryKey: ["winners"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["winners"],
    queryFn: async (): Promise<Winner[]> => {
      const { data, error } = await supabase
        .from("winners")
        .select("id,activity,winner_name,winner_image,congratulation_message,date")
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Winner[];
    },
  });
}
