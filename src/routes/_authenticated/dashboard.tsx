import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Sparkles, Trophy, Users } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { DailySignIn } from "@/components/DailySignIn";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Media";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useMe } from "@/hooks/use-auth";
import { useCommunityStats, useLeaderboard } from "@/hooks/use-platform";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Your SOMMYART CONNECT dashboard: streak, weekly points, community stats and the leaderboard preview.",
      },
      { property: "og:title", content: "Dashboard — SOMMYART CONNECT" },
      { property: "og:description", content: "Track your AI learning streak, points and community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useMe();
  const { data: stats } = useCommunityStats();
  const { data: leaders = [] } = useLeaderboard("weekly_points", 5);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
      <header className="flex items-center gap-3">
        <Logo size={44} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground truncate text-lg font-extrabold">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-xs">Connect • Engage • Grow</p>
        </div>
        <Link to="/profile" aria-label="My profile" className="press">
          <Avatar path={profile?.avatar_url} name={profile?.full_name ?? "SC"} size={40} />
        </Link>
        <ThemeToggle />
      </header>


      <section className="bg-gradient-brand text-primary-foreground shadow-glow animate-fade-up mt-5 grid grid-cols-2 gap-4 rounded-3xl p-5">
        <div>
          <p className="text-xs font-semibold opacity-90">Weekly points</p>
          <p className="text-4xl font-black">{profile?.weekly_points ?? 0}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-sm font-extrabold">
            <Flame className="h-4 w-4" aria-hidden /> {profile?.streak ?? 0} day streak
          </p>
          <p className="text-xs opacity-90">{profile?.points ?? 0} total points</p>
        </div>
      </section>

      <div className="mt-5">
        <DailySignIn />
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Members" value={stats?.members ?? 0} />
        <Stat icon={Sparkles} label="Projects" value={stats?.projects ?? 0} />
      </section>

      <section className="bg-card/85 shadow-card border-border/60 mt-5 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
          <Trophy className="text-primary h-5 w-5" aria-hidden /> This week's top creators
        </h2>
        <div className="mt-3 space-y-2">
          {leaders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No points yet this week — be the first.</p>
          ) : (
            leaders.map((row, index) => (
              <div key={row.id} className="bg-secondary flex items-center gap-3 rounded-2xl p-3">
                <span className="text-primary w-5 text-center text-sm font-extrabold">{index + 1}</span>
                <p className="text-secondary-foreground min-w-0 flex-1 truncate text-sm font-bold">
                  {row.full_name}
                </p>
                <span className="text-primary text-sm font-extrabold">{row.weekly_points}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <AppNav />
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-4 backdrop-blur-xl">
      <Icon className="text-primary h-5 w-5" aria-hidden />
      <p className="text-card-foreground mt-2 text-2xl font-black">{value}</p>
      <p className="text-muted-foreground text-xs font-semibold">{label}</p>
    </div>
  );
}
