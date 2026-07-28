import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { useActivities } from "@/hooks/use-community";
import { DAY_NAMES } from "@/lib/member-types";

export const Route = createFileRoute("/activities")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Weekly Activities — AWKA CONNECT" },
      {
        name: "description",
        content: "Every AWKA CONNECT community activity from Monday to Sunday.",
      },
      { property: "og:title", content: "Weekly Activities — AWKA CONNECT" },
      { property: "og:description", content: "The full Monday–Sunday community activity lineup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Activities,
});

function Activities() {
  const { data: activities = [], isLoading } = useActivities();
  const today = new Date().getDay();
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = [...activities].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">Weekly activities</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        A different way to connect, engage and grow every day.
      </p>

      <div className="mt-6 space-y-3">
        {isLoading && <div className="bg-muted h-40 animate-pulse rounded-3xl" />}
        {sorted.map((a) => (
          <article
            key={a.id}
            className={`shadow-card animate-fade-up rounded-3xl p-5 ${
              a.day === today
                ? "bg-gradient-brand text-primary-foreground"
                : "bg-card/85 text-card-foreground border-border/60 border backdrop-blur-xl"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] uppercase opacity-80">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {DAY_NAMES[a.day]}
              {a.day === today ? " • today" : ""}
            </div>
            <h2 className="mt-2 text-lg font-extrabold">{a.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed opacity-90">{a.description}</p>
          </article>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
