import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { CalendarDays, CheckCircle2, Flame, Star, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCheckInStats, useSignInToday } from "@/hooks/use-checkin";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthGrid(today: string) {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = first.getUTCDay();
  const cells: (string | null)[] = Array.from({ length: pad }, () => null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return {
    cells,
    label: first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export function DailySignIn() {
  const { data, isLoading } = useCheckInStats();
  const signIn = useSignInToday();
  const [flash, setFlash] = useState(false);

  const grid = useMemo(() => monthGrid(data?.today ?? new Date().toISOString().slice(0, 10)), [data?.today]);
  const done = new Set(data?.dates ?? []);

  async function handleSignIn() {
    try {
      const result = await signIn.mutateAsync();
      if (result.already) {
        toast.info("You already signed in today");
        return;
      }
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1600);
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
      toast.success(
        result.bonus
          ? `+${result.points} points — ${result.bonus}!`
          : `+${result.points} points • ${result.streak} day streak`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    }
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl">
      {flash && (
        <div className="bg-card/80 animate-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
          <CheckCircle2 className="text-primary h-14 w-14 animate-[scale-in_0.25s_ease-out]" aria-hidden />
          <p className="text-card-foreground mt-2 text-base font-extrabold">Signed in for today</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
          <Flame className="text-primary h-5 w-5" aria-hidden /> Daily sign-in
        </h2>
        <span className="text-muted-foreground text-xs font-semibold">
          {data?.signedToday ? "✅ Done today" : "Not signed yet"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric icon={Flame} label="Current streak" value={`${data?.currentStreak ?? 0} days`} />
        <Metric icon={CalendarDays} label="Total sign-ins" value={data?.total ?? 0} />
        <Metric icon={Star} label="This month" value={data?.monthly ?? 0} />
        <Metric icon={Trophy} label="Longest streak" value={`${data?.longestStreak ?? 0} days`} />
      </div>

      <Button
        className="press mt-4 h-12 w-full rounded-2xl text-base font-bold"
        disabled={isLoading || signIn.isPending || data?.signedToday}
        onClick={() => void handleSignIn()}
      >
        {data?.signedToday ? "Already signed in today" : signIn.isPending ? "Signing in…" : "Sign in for today"}
      </Button>

      <div className="mt-5">
        <p className="text-muted-foreground text-xs font-bold uppercase">{grid.label}</p>
        <div className="text-muted-foreground mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
          {WEEKDAYS.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.cells.map((date, index) => {
            if (!date) return <span key={`pad-${index}`} />;
            const isDone = done.has(date);
            const isToday = date === data?.today;
            return (
              <span
                key={date}
                className={`flex aspect-square items-center justify-center rounded-xl text-[11px] font-bold ${
                  isDone
                    ? "bg-gradient-brand text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                } ${isToday ? "ring-primary ring-2" : ""}`}
              >
                {Number(date.slice(8))}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        +5 points daily • 7-day streak +20 • 30-day streak +100 • 100-day Community Legend badge
      </p>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-secondary rounded-2xl p-3">
      <Icon className="text-primary h-4 w-4" aria-hidden />
      <p className="text-secondary-foreground mt-1 text-xl font-black">{value}</p>
      <p className="text-muted-foreground text-[11px] font-semibold">{label}</p>
    </div>
  );
}
