import { useMemo } from "react";
import { Cake } from "lucide-react";

import { birthdayLabel, MONTHS, type Member } from "@/lib/members";

/** Birthday celebrants grouped by this month, with today highlighted. */
export function BirthdaysPanel({ members }: { members: Member[] }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const celebrants = useMemo(
    () =>
      members
        .filter((m) => m.birth_month === month)
        .sort((a, b) => a.birth_day - b.birth_day),
    [members, month],
  );

  return (
    <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
      <h2 className="text-card-foreground flex items-center gap-2 font-bold">
        <Cake className="text-primary h-5 w-5" aria-hidden /> Birthday celebrants •{" "}
        {MONTHS[month - 1]}
      </h2>
      <div className="mt-3 space-y-2">
        {celebrants.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No birthdays this month.
          </p>
        )}
        {celebrants.map((m) => {
          const isToday = m.birth_day === day;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                isToday ? "bg-gradient-brand text-primary-foreground" : "bg-secondary"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {m.real_name} “{m.nickname}”
                </p>
                <p className="truncate text-xs opacity-80">
                  {birthdayLabel(m.birth_day, m.birth_month)}
                  {isToday ? " • today 🎉" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
