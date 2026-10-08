import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, FlaskConical, Lightbulb, MessageSquare, Rocket, Sparkles, Target, Users, Wrench } from "lucide-react";

import { AppFooter } from "@/components/AppFooter";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { WEEKLY_TRACKS } from "@/lib/points";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOMMYART CONNECT — AI & Tech Creator Community" },
      {
        name: "description",
        content:
          "Join SOMMYART CONNECT: weekly AI build challenges, demo days, projects, leaderboards and a community of African AI creators.",
      },
      { property: "og:title", content: "SOMMYART CONNECT — AI & Tech Creator Community" },
      {
        property: "og:description",
        content: "Weekly AI challenges, project showcases and a leaderboard for AI creators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const trackIcons = { mission_sunday: Target, ai_tool_challenge: Wrench, tech_challenge_tuesday: Rocket, wip_wednesday: FlaskConical, knowledge_exchange: Lightbulb, demo_day: MessageSquare, community_showcase: Users } as const;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12 sm:max-w-xl md:max-w-2xl">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="animate-fade-up text-center">
        <div className="animate-float">
          <Logo size={190} className="mx-auto h-40 w-40" />
        </div>

        <h1 className="text-foreground mt-6 text-3xl font-extrabold tracking-tight">
          SOMMYART CONNECT
        </h1>
        <p className="text-primary mt-3 text-sm font-semibold tracking-[0.25em] uppercase">
          Connect • Engage • Grow
        </p>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          An AI &amp; tech learning ecosystem: build weekly, share your work, review others and rise
          up the creator leaderboard.
        </p>

        <Button asChild size="lg" className="press shadow-glow mt-8 h-13 w-full rounded-2xl text-base">
          <Link to="/auth">
            Get started <ArrowRight className="ml-1 h-5 w-5" aria-hidden />
          </Link>
        </Button>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Perk icon={Sparkles} label="Weekly challenges" />
          <Perk icon={Rocket} label="Project portfolio" />
          <Perk icon={Users} label="Creator community" />
        </div>

        <section className="bg-card/85 shadow-card border-border/60 mt-6 rounded-3xl border p-5 text-left backdrop-blur-xl">
          <h2 className="text-card-foreground text-base font-extrabold">The weekly rhythm</h2>
          <ul className="mt-3 space-y-2">
            {WEEKLY_TRACKS.map((t) => (
              <li key={t.key} className="flex items-start gap-2 text-sm">
                {(() => { const Icon = trackIcons[t.key]; return <Icon className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />; })()}
                <span className="text-muted-foreground">
                  <span className="text-card-foreground font-bold">{t.label}:</span> {t.title}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <AppFooter />
      </div>
    </main>
  );
}

function Perk({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="bg-card/85 border-border/60 rounded-2xl border p-3 backdrop-blur-xl">
      <Icon className="text-primary mx-auto h-5 w-5" aria-hidden />
      <p className="text-muted-foreground mt-1 text-[11px] font-semibold">{label}</p>
    </div>
  );
}
