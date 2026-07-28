import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bell, Loader2 } from "lucide-react";

import { ActivityCarousel } from "@/components/ActivityCarousel";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { BottomNav } from "@/components/BottomNav";
import { InstallCard } from "@/components/InstallCard";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WelcomeCard } from "@/components/WelcomeCard";
import { WinnerCard } from "@/components/WinnerCard";
import { Button } from "@/components/ui/button";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useActivities, useWinners } from "@/hooks/use-community";
import { useMember } from "@/hooks/use-member";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your AWKA CONNECT Home" },
      {
        name: "description",
        content:
          "Your member card, this week's activities, winners and the latest community announcements.",
      },
      { property: "og:title", content: "Your AWKA CONNECT Home" },
      {
        property: "og:description",
        content: "Member card, weekly activities and community announcements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember();
  const { announcement, loading } = useAnnouncement(true);
  const { data: activities = [] } = useActivities();
  const { data: winners = [] } = useWinners();
  const [notifState, setNotifState] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );

  useEffect(() => {
    if (typeof Notification !== "undefined") setNotifState(Notification.permission);
  }, []);

  useEffect(() => {
    if (!isLoading && !member) navigate({ to: "/login", replace: true });
  }, [isLoading, member, navigate]);

  async function askNotifications() {
    if (typeof Notification === "undefined") return;
    setNotifState(await Notification.requestPermission());
  }

  if (isLoading || !member) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-primary h-7 w-7 animate-spin" aria-hidden />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-5 pb-32">
      <AnnouncementBanner message={announcement?.message} loading={loading} />

      <header className="mt-6 flex items-center gap-3">
        <Logo size={44} className="h-11 w-11" />
        <div className="flex-1">
          <h1 className="text-foreground text-lg leading-tight font-extrabold">AWKA CONNECT</h1>
          <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
            Connect • Engage • Grow
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mt-6 space-y-6">
        <WelcomeCard member={member} />

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-foreground text-base font-extrabold">This week's activities</h2>
            <Link to="/activities" className="text-primary text-xs font-semibold">
              See all
            </Link>
          </div>
          {activities.length ? (
            <ActivityCarousel activities={activities.filter((a) => a.is_active)} />
          ) : (
            <div className="bg-muted h-40 animate-pulse rounded-3xl" />
          )}
        </section>

        {winners.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-foreground text-base font-extrabold">Latest winners</h2>
              <Link to="/winners" className="text-primary text-xs font-semibold">
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {winners.slice(0, 2).map((w) => (
                <WinnerCard key={w.id} winner={w} />
              ))}
            </div>
          </section>
        )}

        <InstallCard />

        {notifState === "default" && (
          <div className="bg-card/85 shadow-card animate-fade-up border-border/60 flex items-center gap-3 rounded-3xl border p-5 backdrop-blur-xl">
            <div className="bg-secondary text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
              <Bell className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex-1">
              <h3 className="text-card-foreground text-sm font-bold">Get announcement alerts</h3>
              <p className="text-muted-foreground text-xs">
                Be notified the moment a new announcement is posted.
              </p>
            </div>
            <Button size="sm" className="press rounded-xl" onClick={() => void askNotifications()}>
              Enable
            </Button>
          </div>
        )}

        <Button asChild variant="secondary" className="press h-12 w-full rounded-2xl">
          <Link to="/activities">
            Explore all activities <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <BottomNav />
    </main>
  );
}
