import { CalendarCheck, Crown, Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAttendance, useLeaderboard, useSignInToday } from "@/hooks/use-attendance";

export function DailySignInCard() {
  const { data, isLoading } = useAttendance();
  const { data: board } = useLeaderboard();
  const signIn = useSignInToday();

  if (isLoading || !data) {
    return <div className="bg-muted h-40 animate-pulse rounded-3xl" />;
  }

  const leader = board?.leaders?.[0];

  return (
    <div className="bg-card/85 shadow-card animate-fade-up border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="bg-secondary text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <CalendarCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="text-card-foreground text-sm font-bold">Daily sign-in</h2>
          <p className="text-muted-foreground text-xs">
            {new Date(`${data.today}T12:00:00Z`).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {data.streak > 0 && (
          <span className="bg-secondary text-primary flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold">
            <Flame className="h-3.5 w-3.5" aria-hidden /> {data.streak}
          </span>
        )}
      </div>

      <Button
        className="press mt-4 h-12 w-full rounded-2xl"
        disabled={data.signedInToday || signIn.isPending}
        onClick={() =>
          signIn.mutate(undefined, {
            onSuccess: () => toast.success("You're signed in for today 🎉"),
            onError: (e) => toast.error((e as Error).message),
          })
        }
      >
        {signIn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
        {data.signedInToday ? "Signed in for today ✓" : "Sign in for today"}
      </Button>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "This month", value: data.monthCount },
          { label: "All time", value: data.totalCount },
          { label: "Rank", value: data.rank ? `#${data.rank}` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-secondary rounded-2xl px-2 py-3">
            <p className="text-secondary-foreground text-base font-extrabold">{s.value}</p>
            <p className="text-muted-foreground text-[11px]">{s.label}</p>
          </div>
        ))}
      </div>

      {leader && (
        <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
          <Crown className="text-primary h-3.5 w-3.5" aria-hidden />
          Member of the month so far:{" "}
          <span className="text-card-foreground font-semibold">{leader.nickname}</span> ({leader.days}{" "}
          days)
        </p>
      )}
    </div>
  );
}
