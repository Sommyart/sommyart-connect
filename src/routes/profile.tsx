import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WelcomeCard } from "@/components/WelcomeCard";
import { Button } from "@/components/ui/button";
import { useLogout, useMember } from "@/hooks/use-member";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Profile — AWKA CONNECT" },
      { name: "description", content: "View your AWKA CONNECT member profile and sign out." },
      { property: "og:title", content: "Your Profile — AWKA CONNECT" },
      { property: "og:description", content: "Your AWKA CONNECT member profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember();
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && !member) navigate({ to: "/login", replace: true });
  }, [isLoading, member, navigate]);

  if (isLoading || !member) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-primary h-7 w-7 animate-spin" aria-hidden />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-extrabold">Your profile</h1>
        <ThemeToggle />
      </div>

      <div className="mt-6 space-y-4">
        <WelcomeCard member={member} />

        <div className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Real name
          </p>
          <p className="text-card-foreground font-semibold">{member.real_name}</p>
        </div>

        <Button
          variant="secondary"
          className="press h-12 w-full rounded-2xl"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut className="mr-1 h-4 w-4" aria-hidden /> Log out
        </Button>
      </div>

      <BottomNav />
    </main>
  );
}
