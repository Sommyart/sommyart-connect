import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Hash, TrendingUp } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/Media";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-auth";
import { useFeed, useSavedPostIds } from "@/hooks/use-feed";
import { useBlocks } from "@/hooks/use-messages";
import { useLeaderboard } from "@/hooks/use-platform";
import { WEEKLY_TRACKS } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Community Feed — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Discussions, wins and work-in-progress updates from the SOMMYART CONNECT AI creator community.",
      },
      { property: "og:title", content: "Community Feed — SOMMYART CONNECT" },
      { property: "og:description", content: "See what AI creators are building right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedPage,
});

function trendingHashtags(posts: { content: string }[], max = 6) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.content.matchAll(/#([A-Za-z0-9_]{2,30})/g)) {
      const key = tag[1]!.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
}

function FeedPage() {
  const { user } = useMe();
  const { data: allPosts = [], isLoading } = useFeed();
  const { data: savedIds = [] } = useSavedPostIds(user?.id);
  const { data: leaders = [] } = useLeaderboard("points", 5);
  const [view, setView] = useState<"all" | "saved">("all");

  const visible = view === "saved" ? posts.filter((p) => savedIds.includes(p.id)) : posts;
  const trending = useMemo(() => trendingHashtags(posts), [posts]);

  useEffect(() => {
    if (posts.length === 0 || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [posts]);

  return (
    <main className="mx-auto min-h-dvh w-full px-3 pt-5 pb-32 sm:px-5 md:px-8 md:pt-8">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-foreground truncate text-2xl font-extrabold">Community feed</h1>
            <div className="flex gap-2">
              {(["all", "saved"] as const).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={view === key ? "default" : "secondary"}
                  className="press rounded-lg capitalize"
                  onClick={() => setView(key)}
                >
                  {key === "all" ? "All posts" : "Bookmarks"}
                </Button>
              ))}
            </div>
          </div>

          {user && (
            <div className="mt-4">
              <PostComposer userId={user.id} />
            </div>
          )}

          <div className="mt-5 space-y-4">
            {isLoading && <div className="bg-muted h-32 animate-pulse rounded-xl" />}
            {!isLoading && visible.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {view === "saved" ? "No bookmarks yet." : "No posts yet — start the first discussion."}
              </p>
            )}
            {visible.map((post) => (
              <PostCard key={post.id} post={post} userId={user?.id ?? null} saved={savedIds.includes(post.id)} />
            ))}
          </div>
        </section>

        <aside className="hidden w-full space-y-4 lg:sticky lg:top-6 lg:block">
          {trending.length > 0 && (
            <div className="bg-card border-border shadow-soft rounded-xl border p-4">
              <h2 className="text-card-foreground flex items-center gap-2 text-sm font-extrabold">
                <TrendingUp className="text-primary h-4 w-4" aria-hidden /> Trending topics
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {trending.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  >
                    <Hash className="h-3 w-3" aria-hidden />
                    {tag}
                    <span className="text-muted-foreground font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border-border shadow-soft rounded-xl border p-4">
            <h2 className="text-card-foreground flex items-center gap-2 text-sm font-extrabold">
              <Flame className="text-primary h-4 w-4" aria-hidden /> Top creators
            </h2>
            <ul className="mt-3 space-y-3">
              {leaders.map((leader, i) => (
                <li key={leader.id} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-4 text-xs font-extrabold tabular-nums">
                    {i + 1}
                  </span>
                  <Avatar path={leader.avatar_url} name={leader.full_name ?? "SC"} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-card-foreground truncate text-sm font-bold">
                      {leader.full_name ?? "Member"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      @{leader.username} • {leader.points ?? 0} pts
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/leaderboard"
              className="text-primary press mt-3 block text-center text-xs font-bold underline"
            >
              View full leaderboard
            </Link>
          </div>

          <div className="bg-card border-border shadow-soft rounded-xl border p-4">
            <h2 className="text-card-foreground text-sm font-extrabold">This week's rhythm</h2>
            <ul className="mt-3 space-y-2">
              {WEEKLY_TRACKS.map((t) => (
                <li key={t.key} className="flex items-start gap-2 text-xs">
                  <span className="text-primary font-extrabold">{t.label}</span>
                  <span className="text-muted-foreground min-w-0 flex-1">{t.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <AppNav />
    </main>
  );
}
