import { createFileRoute } from "@tanstack/react-router";

import { BottomNav } from "@/components/BottomNav";
import { WinnerCard } from "@/components/WinnerCard";
import { useWinners } from "@/hooks/use-community";

export const Route = createFileRoute("/winners")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Community Winners — AWKA CONNECT" },
      { name: "description", content: "Celebrating AWKA CONNECT activity winners each week." },
      { property: "og:title", content: "Community Winners — AWKA CONNECT" },
      { property: "og:description", content: "Celebrating our weekly activity winners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Winners,
});

function Winners() {
  const { data: winners = [], isLoading } = useWinners();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">Winners</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Shining a light on members who showed up and stood out.
      </p>

      <div className="mt-6 space-y-3">
        {isLoading && <div className="bg-muted h-28 animate-pulse rounded-3xl" />}
        {!isLoading && winners.length === 0 && (
          <p className="text-muted-foreground bg-card/85 border-border/60 rounded-3xl border p-6 text-center text-sm">
            No winners announced yet — check back soon.
          </p>
        )}
        {winners.map((w) => (
          <WinnerCard key={w.id} winner={w} />
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
