import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, FlaskConical, Lightbulb, MessageSquare, Rocket, Sparkles, Target, Wrench } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { useChallenges, useEvents } from "@/hooks/use-challenges";
import { WEEKLY_TRACKS, trackForToday } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/weekly")({
  head: () => ({
    meta: [
      { title: "Weekly Activities — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Mission Sunday to Demo Day: the SOMMYART CONNECT weekly AI build rhythm plus this month's community events.",
      },
      { property: "og:title", content: "Weekly Activities — SOMMYART CONNECT" },
      {
        property: "og:description",
        content: "The Sunday–Friday AI challenge rhythm and monthly events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeeklyPage,
});

function WeeklyPage() {
  const today = trackForToday();
  const { data: challenges = [] } = useChallenges();
  const { data: events = [] } = useEvents();
  const trackIcons = { mission_sunday: Target, ai_tool_challenge: Wrench, tech_challenge_tuesday: Rocket, wip_wednesday: FlaskConical, knowledge_exchange: Lightbulb, demo_day: MessageSquare } as const;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
      <h1 className="text-foreground text-2xl font-extrabold">Weekly activities</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Build, share, review and demo — every week, together.
      </p>

      <div className="mt-6 space-y-3">
        {WEEKLY_TRACKS.map((track) => {
          const detail = challenges.find((c) => c.track === track.key);
          const isToday = track.key === today.key;
          return (
            <article
              key={track.key}
              className={`shadow-card animate-fade-up rounded-3xl p-5 ${
                isToday
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-card/85 text-card-foreground border-border/60 border backdrop-blur-xl"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] uppercase opacity-80">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {track.label}
                {isToday ? " • today" : ""}
              </div>
              <h2 className="mt-2 text-lg font-extrabold">
                {(() => { const Icon = trackIcons[track.key]; return <Icon className="mr-1 inline h-5 w-5" aria-hidden />; })()} {track.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed opacity-90">
                {detail?.description ?? track.tagline}
              </p>
              <p className="mt-2 text-xs font-semibold opacity-80">
                {detail?.prompt ?? track.prompt}
              </p>
            </article>
          );
        })}
      </div>

      <h2 className="text-foreground mt-8 flex items-center gap-2 text-lg font-extrabold">
        <Sparkles className="text-primary h-5 w-5" aria-hidden /> Monthly events
      </h2>
      <div className="mt-3 space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl"
          >
            <p className="text-primary text-[11px] font-bold tracking-widest uppercase">
              Week {event.week_of_month ?? "—"}
            </p>
            <h3 className="text-card-foreground mt-1 text-base font-extrabold">{event.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{event.description}</p>
          </article>
        ))}
      </div>

      <AppNav />
    </main>
  );
}
