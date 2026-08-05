import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import {
  adminAnalytics,
  adminAuditLog,
  adminDeleteContent,
  adminListMembers,
  adminListReports,
  adminResolveReport,
  adminSaveContent,
  adminUpdateMember,
} from "@/lib/admin.functions";

export function useAdminAnalytics(enabled: boolean) {
  const run = useServerFn(adminAnalytics);
  return useQuery({ queryKey: ["admin-analytics"], enabled, queryFn: () => run() });
}

export function useAdminMembers(search: string, enabled: boolean) {
  const run = useServerFn(adminListMembers);
  return useQuery({
    queryKey: ["admin-members", search],
    enabled,
    queryFn: () => run({ data: { search } }),
  });
}

export function useAdminReports(enabled: boolean) {
  const run = useServerFn(adminListReports);
  return useQuery({ queryKey: ["admin-reports"], enabled, queryFn: () => run() });
}

export function useAdminAudit(enabled: boolean) {
  const run = useServerFn(adminAuditLog);
  return useQuery({ queryKey: ["admin-audit"], enabled, queryFn: () => run() });
}

export function useAdminMemberAction() {
  const run = useServerFn(adminUpdateMember);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; suspended?: boolean; featured?: boolean }) =>
      run({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });
}

export function useResolveReport() {
  const run = useServerFn(adminResolveReport);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { reportId: string; deletePost: boolean }) => run({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });
}

type ContentTable = "challenges" | "events" | "announcements" | "rewards";

export function useAdminContent(table: ContentTable, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-content", table],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveContent() {
  const run = useServerFn(adminSaveContent);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { table: ContentTable; id?: string; values: Record<string, unknown> }) =>
      run({ data: input }),
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-content", vars.table] });
      void queryClient.invalidateQueries({ queryKey: ["announcement"] });
    },
  });
}

export function useDeleteContent() {
  const run = useServerFn(adminDeleteContent);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { table: ContentTable; id: string }) => run({ data: input }),
    onSuccess: (_d, vars) =>
      void queryClient.invalidateQueries({ queryKey: ["admin-content", vars.table] }),
  });
}
