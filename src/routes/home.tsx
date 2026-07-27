import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, UserPlus } from "lucide-react";

import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { InstallCard } from "@/components/InstallCard";
import { Logo } from "@/components/Logo";
import { MemberCard } from "@/components/MemberCard";
import { Button } from "@/components/ui/button";
import { useAnnouncement } from "@/hooks/use-announcement";
import { getLocalMember, type Member } from "@/lib/members";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your AWKA CONNECT Home" },
      {
        name: "description",
        content: "Your AWKA CONNECT member profile and the latest community announcements.",
      },
      { property: "og:title", content: "Your AWKA CONNECT Home" },
      {
        property: "og:description",
        content: "Your member profile and the latest community announcements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { announcement, loading } = useAnnouncement(true);
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  const [notifState, setNotifState] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );

  useEffect(() => {
    setMember(getLocalMember());
    setReady(true);
    if (typeof Notification !== "undefined") setNotifState(Notification.permission);
  }, []);

  async function askNotifications() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifState(result);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-5 pb-12">
      <AnnouncementBanner message={announcement?.message} loading={loading} />

      <header className="mt-6 flex items-center gap-3">
        <Logo size={44} className="h-11 w-11" />
        <div>
          <h1 className="text-foreground text-lg leading-tight font-extrabold">AWKA CONNECT</h1>
          <p className="text-primary text-[11px] font-semibold tracking-[0.2em] uppercase">
            Connect • Engage • Grow
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-5">
        {!ready ? (
          <div className="bg-muted h-64 animate-pulse rounded-3xl" />
        ) : member ? (
          <MemberCard member={member} />
        ) : (
          <div className="bg-card shadow-card animate-fade-up rounded-3xl p-6 text-center">
            <UserPlus className="text-primary mx-auto h-9 w-9" aria-hidden />
            <h2 className="text-card-foreground mt-3 font-bold">You're not registered yet</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Join the community to see your member card here.
            </p>
            <Button asChild className="press mt-4 w-full rounded-2xl">
              <Link to="/join">Join Community</Link>
            </Button>
          </div>
        )}

        <InstallCard />

        {notifState === "default" && (
          <div className="bg-card shadow-card animate-fade-up flex items-center gap-3 rounded-3xl p-5">
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
      </div>
    </main>
  );
}
