import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Trophy } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-auth";
import { useLeaderboard, type LeaderScope } from "@/hooks/use-platform";
import { levelFor } from "@/lib/points";

const SCOPES: { key: LeaderScope; label: string }[] = [
  { key: "weekly_points", label: "This week" },
  { key: "monthly_points", label: "This month" },
  { key: "points", label: "All time" },
];

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Weekly, monthly and all-time rankings of the most active builders in the SOMMYART CONNECT community.",
      },
      { property: "og:title", content: "Leaderboard — SOMMYART CONNECT" },
      { property: "og:description", content: "See who is leading the AI creator community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useMe();
  const [scope, setScope] = useState<LeaderScope>("weekly_points");
  const { data: rows = [], isLoading } = useLeaderboard(scope, 50);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground flex items-center gap-2 text-2xl font-extrabold">
        <Trophy className="text-primary h-6 w-6" aria-hidden /> Leaderboard
      </h1>

      <div className="mt-4 flex gap-2">
        {SCOPES.map((s) => (
          <Button
            key={s.key}
            size="sm"
            variant={scope === s.key ? "default" : "secondary"}
            className="press rounded-xl"
            onClick={() => setScope(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {isLoading && <div className="bg-muted h-32 animate-pulse rounded-3xl" />}
        {rows.map((row, i) => {
          const points = (row[scope] as number) ?? 0;
          const level = levelFor(row.points ?? 0);
          const isMe = row.id === user?.id;
          return (
            <div
              key={row.id}
              className={`animate-fade-up flex items-center gap-3 rounded-3xl border p-3.5 ${
                isMe
                  ? "border-primary/40 bg-primary/5"
                  : "bg-card/85 border-border/60 backdrop-blur-xl"
              }`}
            >
              <span className="text-muted-foreground w-6 text-center text-sm font-extrabold">
                {i + 1}
              </span>
              <Avatar path={row.avatar_url} name={row.full_name ?? "SC"} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-card-foreground truncate text-sm font-bold">{row.full_name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {level.icon} {level.name} • @{row.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-primary text-sm font-extrabold">{points} pts</p>
                <p className="text-muted-foreground flex items-center justify-end gap-1 text-[11px] font-semibold">
                  <Flame className="h-3 w-3" aria-hidden /> {row.streak ?? 0}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <AppNav />
    </main>
  );
}
