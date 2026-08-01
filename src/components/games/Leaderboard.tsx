import { Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { getPictureUrl } from "@/lib/members";
import { useLeaderboard, type LeaderRow } from "@/hooks/use-games";

const TIER_LABEL = (points: number) =>
  points >= 1500
    ? "👑 Community Legend"
    : points >= 700
      ? "💎 Platinum Member"
      : points >= 300
        ? "🥇 Gold Member"
        : points >= 100
          ? "🥈 Silver Member"
          : "🥉 Bronze Member";

function Avatar({ row }: { row: LeaderRow }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getPictureUrl(row.profile_picture).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [row.profile_picture]);

  return url ? (
    <img src={url} alt={row.nickname} className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <div className="bg-secondary text-primary flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold">
      {row.nickname.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Leaderboard() {
  const { data: rows = [], isLoading } = useLeaderboard();
  const champion = rows[0];

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
        <Trophy className="text-primary h-5 w-5" aria-hidden /> AWKA Points leaderboard
      </h2>

      {champion && (
        <div className="bg-gradient-brand text-primary-foreground shadow-glow mt-3 flex items-center gap-3 rounded-3xl p-4">
          <Crown className="h-6 w-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold">{champion.nickname}</p>
            <p className="text-xs opacity-90">Current champion • {champion.total_points} points</p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-2xl" />
          ))
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No points yet — play a game to top the board!
          </p>
        ) : (
          rows.map((row, i) => (
            <div key={row.member_id} className="bg-secondary flex items-center gap-3 rounded-2xl p-3">
              <span className="text-primary w-6 shrink-0 text-center text-sm font-extrabold">
                {i + 1}
              </span>
              <Avatar row={row} />
              <div className="min-w-0 flex-1">
                <p className="text-secondary-foreground truncate text-sm font-bold">
                  {row.nickname} {row.featured && <Medal className="inline h-4 w-4 text-primary" />}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {TIER_LABEL(row.total_points)}
                </p>
              </div>
              <span className="text-primary shrink-0 text-sm font-extrabold">
                {row.total_points}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
