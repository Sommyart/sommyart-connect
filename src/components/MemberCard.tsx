import { useEffect, useState } from "react";
import { Briefcase, Cake, User } from "lucide-react";
import { birthdayLabel, getPictureUrl, type Member } from "@/lib/members";

export function MemberCard({ member }: { member: Member }) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPictureUrl(member.profile_picture).then((url) => {
      if (active) setPhoto(url);
    });
    return () => {
      active = false;
    };
  }, [member.profile_picture]);

  return (
    <div className="bg-card shadow-card animate-fade-up rounded-3xl p-6 text-center">
      <div className="bg-gradient-brand shadow-glow mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full p-1">
        {photo ? (
          <img
            src={photo}
            alt={`${member.real_name}'s profile picture`}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="bg-secondary text-muted-foreground flex h-full w-full items-center justify-center rounded-full">
            <User className="h-10 w-10" aria-hidden />
          </div>
        )}
      </div>

      <h2 className="text-card-foreground mt-4 text-xl font-bold">{member.real_name}</h2>
      <p className="text-primary text-sm font-semibold">“{member.nickname}”</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="bg-secondary rounded-2xl px-3 py-3 text-left">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
            <Briefcase className="h-3.5 w-3.5" aria-hidden /> Occupation
          </div>
          <p className="text-secondary-foreground mt-1 text-sm font-semibold">
            {member.occupation}
          </p>
        </div>
        <div className="bg-secondary rounded-2xl px-3 py-3 text-left">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
            <Cake className="h-3.5 w-3.5" aria-hidden /> Birthday
          </div>
          <p className="text-secondary-foreground mt-1 text-sm font-semibold">
            {birthdayLabel(member.birth_day, member.birth_month)}
          </p>
        </div>
      </div>
    </div>
  );
}
