import { useEffect, useState } from "react";
import { Award, Trophy } from "lucide-react";

import { getPictureUrl } from "@/lib/members";
import type { Winner } from "@/lib/member-types";

export function WinnerCard({ winner }: { winner: Winner }) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPictureUrl(winner.winner_image).then((url) => active && setPhoto(url));
    return () => {
      active = false;
    };
  }, [winner.winner_image]);

  return (
    <article className="shadow-card animate-fade-up bg-gradient-brand rounded-3xl p-[1.5px]">
      <div className="bg-card/92 flex gap-4 rounded-3xl p-4 backdrop-blur-xl">
        <div className="bg-gradient-brand shadow-glow h-20 w-20 shrink-0 overflow-hidden rounded-2xl p-[3px]">
          {photo ? (
            <img
              src={photo}
              alt={`${winner.winner_name}`}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="bg-secondary text-primary flex h-full w-full items-center justify-center rounded-2xl">
              <Trophy className="h-8 w-8" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-primary text-[11px] font-bold tracking-[0.16em] uppercase">
            {winner.activity}
          </p>
          <h3 className="text-card-foreground truncate text-lg font-extrabold">
            {winner.winner_name}
          </h3>
          {winner.congratulation_message && (
            <p className="text-muted-foreground mt-1 text-sm leading-snug">
              {winner.congratulation_message}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="bg-gradient-brand text-primary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
              <Award className="h-3 w-3" aria-hidden /> Congratulations
            </span>
            <span className="text-muted-foreground text-[11px] font-medium">
              {new Date(winner.date).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
