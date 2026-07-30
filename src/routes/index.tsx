import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LogIn } from "lucide-react";

import { AppFooter } from "@/components/AppFooter";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AWKA CONNECT — Connect, Engage, Grow" },
      {
        name: "description",
        content:
          "Join the AWKA CONNECT community: weekly activities, live announcements, winners and more.",
      },
      { property: "og:title", content: "AWKA CONNECT — Connect, Engage, Grow" },
      {
        property: "og:description",
        content: "Weekly activities, live announcements and community winners in one app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="animate-fade-up w-full max-w-sm text-center">
        <div className="animate-float">
          <Logo size={200} className="mx-auto h-44 w-44" />
        </div>

        <h1 className="text-foreground mt-6 text-3xl font-extrabold tracking-tight">
          Welcome to AWKA CONNECT
        </h1>
        <p className="text-primary mt-3 text-sm font-semibold tracking-[0.25em] uppercase">
          Connect • Engage • Grow
        </p>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          Register once, sign in with your nickname and 4-digit PIN, and never miss an activity,
          announcement or winner.
        </p>

        <Button
          asChild
          size="lg"
          className="press shadow-glow mt-8 h-13 w-full rounded-2xl text-base"
        >
          <Link to="/register">
            Create your account <ArrowRight className="ml-1 h-5 w-5" aria-hidden />
          </Link>
        </Button>

        <Button
          asChild
          variant="secondary"
          size="lg"
          className="press mt-3 h-13 w-full rounded-2xl text-base"
        >
          <Link to="/login">
            <LogIn className="mr-1 h-5 w-5" aria-hidden /> I already have an account
          </Link>
        </Button>
      </div>
    </main>
  );
}
