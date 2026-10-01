import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Gamepad2, Home, Rocket, Trophy, Users } from "lucide-react";

import { useMe } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";

const items = [
  { to: "/feed", label: "Feed", icon: Newspaper },
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/projects", label: "Projects", icon: Rocket },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
  { to: "/notifications", label: "Alerts", icon: Bell },
] as const;

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useMe();
  const unread = useUnreadCount(user?.id);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="bg-card/80 shadow-card border-border/60 pointer-events-auto flex w-full max-w-lg items-center justify-around md:max-w-xl gap-1 rounded-3xl border p-1.5 backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          const badge = to === "/notifications" && unread > 0;
          return (
            <Link
              key={to}
              to={to}
              className={`press relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold ${
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {badge && (
                <span className="bg-primary text-primary-foreground absolute top-1 right-1.5 min-w-4 rounded-full px-1 text-[9px] leading-4 font-extrabold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
