import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AWKA CONNECT — Connect, Engage, Grow" },
      {
        name: "description",
        content:
          "Join the AWKA CONNECT community. Register your details and stay updated with live announcements.",
      },
      { property: "og:title", content: "AWKA CONNECT — Connect, Engage, Grow" },
      {
        property: "og:description",
        content: "Join the AWKA CONNECT community and never miss an announcement.",
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
          One community, one place. Register your details and stay informed with live
          announcements from the AWKA CONNECT team.
        </p>

        <Button asChild size="lg" className="press shadow-glow mt-8 h-13 w-full rounded-2xl text-base">
          <Link to="/join">
            Join Community <ArrowRight className="ml-1 h-5 w-5" aria-hidden />
          </Link>
        </Button>

        <Link
          to="/home"
          className="text-muted-foreground hover:text-primary mt-5 inline-block text-sm font-medium transition-colors"
        >
          Already registered? Go to home
        </Link>
      </div>
    </main>
  );
}
