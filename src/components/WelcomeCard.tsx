import { useEffect, useState } from "react";
import { Briefcase, Cake, Sparkles } from "lucide-react";

import { birthdayLabel, getPictureUrl } from "@/lib/members";
import type { PublicMember } from "@/lib/member-types";

export function WelcomeCard({ member }: { member: PublicMember }) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPictureUrl(member.profile_picture).then((url) => active && setPhoto(url));
    return () => {
      active = false;
    };
  }, [member.profile_picture]);

  return (
    <div className="bg-gradient-brand shadow-glow animate-fade-up relative overflow-hidden rounded-3xl p-[1.5px]">
      <div className="bg-card/90 rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-brand shadow-glow h-20 w-20 shrink-0 overflow-hidden rounded-full p-[3px]">
            {photo ? (
              <img
                src={photo}
                alt={`${member.nickname}'s profile picture`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="bg-secondary text-primary flex h-full w-full items-center justify-center rounded-full text-xl font-extrabold">
                {member.nickname.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Hello
            </p>
            <h2 className="text-card-foreground truncate text-2xl font-extrabold">
              {member.nickname}
            </h2>
            <p className="text-primary flex items-center gap-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> AWKA CONNECT member
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-secondary rounded-2xl px-3 py-2.5">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
              <Briefcase className="h-3.5 w-3.5" aria-hidden /> Occupation
            </div>
            <p className="text-secondary-foreground mt-0.5 truncate text-sm font-semibold">
              {member.occupation}
            </p>
          </div>
          <div className="bg-secondary rounded-2xl px-3 py-2.5">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
              <Cake className="h-3.5 w-3.5" aria-hidden /> Birthday
            </div>
            <p className="text-secondary-foreground mt-0.5 text-sm font-semibold">
              {birthdayLabel(member.birth_day, member.birth_month)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
