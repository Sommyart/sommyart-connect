import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Rocket, Trophy, Users } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/weekly", label: "Weekly", icon: LayoutGrid },
  { to: "/feed", label: "Feed", icon: Users },
  { to: "/projects", label: "Projects", icon: Rocket },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
] as const;

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="bg-card/80 shadow-card border-border/60 pointer-events-auto flex w-full max-w-lg items-center justify-around gap-1 rounded-3xl border p-1.5 backdrop-blur-xl">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`press flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold ${
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
