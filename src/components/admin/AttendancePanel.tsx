import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, lagosTodayClient, monthRange } from "@/lib/admin-utils";
import type { Member } from "@/lib/members";

export function AttendancePanel({ members }: { members: Member[] }) {
  const [date, setDate] = useState(lagosTodayClient());
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = monthRange(date);
    const [{ data: day }, { data: month }] = await Promise.all([
      supabase.from("attendance").select("member_id").eq("date", date),
      supabase.from("attendance").select("member_id").gte("date", start).lte("date", end),
    ]);
    setPresent(new Set((day ?? []).map((r) => r.member_id)));
    const counts: Record<string, number> = {};
    for (const r of month ?? []) counts[r.member_id] = (counts[r.member_id] ?? 0) + 1;
    setMonthCounts(counts);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(memberId: string) {
    const isPresent = present.has(memberId);
    const { error } = isPresent
      ? await supabase.from("attendance").delete().eq("member_id", memberId).eq("date", date)
      : await supabase.from("attendance").insert({ member_id: memberId, date });
    if (error) {
      toast.error(error.message);
      return;
    }
    setPresent((prev) => {
      const next = new Set(prev);
      if (isPresent) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
    setMonthCounts((prev) => ({
      ...prev,
      [memberId]: Math.max(0, (prev[memberId] ?? 0) + (isPresent ? -1 : 1)),
    }));
  }

  const ranked = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          (monthCounts[b.id] ?? 0) - (monthCounts[a.id] ?? 0) ||
          a.real_name.localeCompare(b.real_name),
      ),
    [members, monthCounts],
  );

  return (
    <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="att-date">Attendance date</Label>
          <Input
            id="att-date"
            type="date"
            className="h-11 rounded-2xl"
            value={date}
            max={lagosTodayClient()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          className="press h-11 rounded-2xl"
          onClick={() =>
            downloadCsv(
              `awka-connect-attendance-${date}.csv`,
              ["Member", "Nickname", "Present", "Days this month"],
              ranked.map((m) => [
                m.real_name,
                m.nickname,
                present.has(m.id) ? "Yes" : "No",
                monthCounts[m.id] ?? 0,
              ]),
            )
          }
        >
          <Download className="mr-1 h-4 w-4" aria-hidden /> CSV
        </Button>
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        {present.size} of {members.length} members signed in on this day. Ranking below is for the
        selected month.
      </p>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="bg-muted h-16 animate-pulse rounded-2xl" />
        ) : (
          ranked.map((m, i) => (
            <div key={m.id} className="bg-secondary flex items-center gap-3 rounded-2xl px-4 py-3">
              <span className="text-primary w-6 text-sm font-extrabold">#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-secondary-foreground truncate text-sm font-semibold">
                  {m.real_name} <span className="text-primary">“{m.nickname}”</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  {monthCounts[m.id] ?? 0} days this month
                </p>
              </div>
              <Button
                size="sm"
                variant={present.has(m.id) ? "default" : "secondary"}
                className="press rounded-xl"
                onClick={() => void toggle(m.id)}
              >
                {present.has(m.id) ? "Present" : "Mark present"}
              </Button>
            </div>
          ))
        )}
        {!loading && ranked.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">No members yet.</p>
        )}
        {loading && <Loader2 className="sr-only" aria-hidden />}
      </div>
    </section>
  );
}
