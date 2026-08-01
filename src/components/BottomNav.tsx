import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Gamepad2, Home, Trophy, User } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/activities", label: "Activities", icon: CalendarDays },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/winners", label: "Winners", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
] as const;


export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="bg-card/85 shadow-card pointer-events-auto flex w-full max-w-md items-center justify-around gap-1 rounded-3xl border border-border/60 p-2 backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`press flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
