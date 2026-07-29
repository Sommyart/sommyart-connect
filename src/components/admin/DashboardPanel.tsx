import { useEffect, useState } from "react";
import { CalendarCheck, HandCoins, TrendingUp, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lagosTodayClient, monthRange } from "@/lib/admin-utils";

export function DashboardPanel() {
  const [stats, setStats] = useState({ members: 0, today: 0, monthSignIns: 0, paid: 0 });

  useEffect(() => {
    const today = lagosTodayClient();
    const { start, end } = monthRange(today);
    void (async () => {
      const [members, todayRows, monthRows, paid] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .gte("date", start)
          .lte("date", end),
        supabase
          .from("contributions")
          .select("id", { count: "exact", head: true })
          .eq("status", "paid")
          .eq("year", Number(today.slice(0, 4)))
          .eq("month", Number(today.slice(5, 7))),
      ]);
      setStats({
        members: members.count ?? 0,
        today: todayRows.count ?? 0,
        monthSignIns: monthRows.count ?? 0,
        paid: paid.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Members", value: stats.members, icon: Users },
    { label: "Signed in today", value: stats.today, icon: CalendarCheck },
    { label: "Sign-ins this month", value: stats.monthSignIns, icon: TrendingUp },
    { label: "Paid this month", value: stats.paid, icon: HandCoins },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="bg-card shadow-card rounded-3xl p-5">
          <div className="bg-secondary text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-card-foreground mt-3 text-2xl font-extrabold">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      ))}
    </div>
  );
}
