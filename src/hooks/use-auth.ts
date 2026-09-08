import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  username: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  bio: string | null;
  avatar_url: string | null;
  points: number;
  weekly_points: number;
  monthly_points: number;
  streak: number;
  suspended: boolean;
  featured: boolean;
  created_at: string;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile(userId?: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    staleTime: 30_000,
  });
}

export function useMe() {
  const { user, loading } = useSession();
  const profile = useProfile(user?.id);
  return { user, profile: profile.data ?? null, loading: loading || profile.isLoading };
}

export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ["profile-username", username],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile> & { id: string; is_admin?: boolean }) => {
      const { id, is_admin: _ignoredAdminField, ...rest } = patch;
      const safePatch = rest as Database["public"]["Tables"]["profiles"]["Update"];
      const { error } = await supabase.from("profiles").update(safePatch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useIsAdmin(user: User | null) {
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return Boolean(data);
    },
  });
}

export function useAdminIds(ids: string[]) {
  return useQuery({
    queryKey: ["admin-ids", ...ids.slice().sort()],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin").in("user_id", ids);
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.user_id));
    },
    staleTime: 60_000,
  });
}

export async function signOutEverywhere(queryClient: { cancelQueries: () => Promise<void>; clear: () => void }) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}
