import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTRIBUTION_STATUSES,
  downloadCsv,
  lagosTodayClient,
  STATUS_LABEL,
  type ContributionStatus,
} from "@/lib/admin-utils";
import { MONTHS, type Member } from "@/lib/members";

type Row = { status: ContributionStatus; amount: string; remarks: string };

export function ContributionsPanel({ members }: { members: Member[] }) {
  const today = lagosTodayClient();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contributions")
      .select("member_id,status,amount,remarks")
      .eq("year", year)
      .eq("month", month);
    if (error) toast.error(error.message);
    const next: Record<string, Row> = {};
    for (const r of data ?? [])
      next[r.member_id] = {
        status: r.status as ContributionStatus,
        amount: r.amount == null ? "" : String(r.amount),
        remarks: r.remarks ?? "",
      };
    setRows(next);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(memberId: string, patch: Partial<Row>) {
    const current: Row = rows[memberId] ?? { status: "not_paid", amount: "", remarks: "" };
    const merged = { ...current, ...patch };
    setRows((prev) => ({ ...prev, [memberId]: merged }));
    const { error } = await supabase.from("contributions").upsert(
      {
        member_id: memberId,
        year,
        month,
        status: merged.status,
        amount: merged.amount ? Number(merged.amount) : null,
        remarks: merged.remarks || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_id,year,month" },
    );
    if (error) toast.error(error.message);
  }

  const totals = useMemo(() => {
    const list = Object.values(rows);
    return {
      paid: list.filter((r) => r.status === "paid").length,
      pending: list.filter((r) => r.status === "pending").length,
      amount: list.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    };
  }, [rows]);

  return (
    <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-month">Month</Label>
          <select
            id="c-month"
            className="border-input bg-background h-11 rounded-2xl border px-3 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28 space-y-1.5">
          <Label htmlFor="c-year">Year</Label>
          <Input
            id="c-year"
            type="number"
            className="h-11 rounded-2xl"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <Button
          variant="secondary"
          className="press h-11 rounded-2xl"
          onClick={() =>
            downloadCsv(
              `awka-connect-contributions-${year}-${String(month).padStart(2, "0")}.csv`,
              ["Member", "Nickname", "Status", "Amount", "Remarks"],
              members.map((m) => {
                const r = rows[m.id];
                return [
                  m.real_name,
                  m.nickname,
                  STATUS_LABEL[r?.status ?? "not_paid"],
                  r?.amount ?? "",
                  r?.remarks ?? "",
                ];
              }),
            )
          }
        >
          <Download className="mr-1 h-4 w-4" aria-hidden /> CSV
        </Button>
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        {totals.paid} paid • {totals.pending} pending • ₦{totals.amount.toLocaleString()} recorded
      </p>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="bg-muted h-20 animate-pulse rounded-2xl" />
        ) : (
          members.map((m) => {
            const r = rows[m.id] ?? { status: "not_paid", amount: "", remarks: "" };
            return (
              <div key={m.id} className="bg-secondary space-y-2 rounded-2xl px-4 py-3">
                <p className="text-secondary-foreground truncate text-sm font-semibold">
                  {m.real_name} <span className="text-primary">“{m.nickname}”</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label={`Status for ${m.real_name}`}
                    className="border-input bg-background h-10 rounded-xl border px-2 text-sm"
                    value={r.status}
                    onChange={(e) =>
                      void save(m.id, { status: e.target.value as ContributionStatus })
                    }
                  >
                    {CONTRIBUTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label={`Amount for ${m.real_name}`}
                    placeholder="Amount"
                    inputMode="decimal"
                    className="h-10 w-28 rounded-xl"
                    value={r.amount}
                    onChange={(e) =>
                      setRows((prev) => ({ ...prev, [m.id]: { ...r, amount: e.target.value } }))
                    }
                    onBlur={(e) => void save(m.id, { amount: e.target.value })}
                  />
                  <Input
                    aria-label={`Remarks for ${m.real_name}`}
                    placeholder="Remarks"
                    className="h-10 min-w-32 flex-1 rounded-xl"
                    value={r.remarks}
                    onChange={(e) =>
                      setRows((prev) => ({ ...prev, [m.id]: { ...r, remarks: e.target.value } }))
                    }
                    onBlur={(e) => void save(m.id, { remarks: e.target.value })}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
