import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { AppNav } from "@/components/AppNav";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-auth";
import { useFeed, useSavedPostIds } from "@/hooks/use-feed";

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

function FeedPage() {
  const { user } = useMe();
  const { data: posts = [], isLoading } = useFeed();
  const { data: savedIds = [] } = useSavedPostIds(user?.id);
  const [view, setView] = useState<"all" | "saved">("all");

  const visible = view === "saved" ? posts.filter((p) => savedIds.includes(p.id)) : posts;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">Community feed</h1>

      {user && (
        <div className="mt-4">
          <PostComposer userId={user.id} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {(["all", "saved"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={view === key ? "default" : "secondary"}
            className="press rounded-xl capitalize"
            onClick={() => setView(key)}
          >
            {key === "all" ? "All posts" : "Bookmarks"}
          </Button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && <div className="bg-muted h-32 animate-pulse rounded-3xl" />}
        {!isLoading && visible.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {view === "saved" ? "No bookmarks yet." : "No posts yet — start the first discussion."}
          </p>
        )}
        {visible.map((post) => (
          <PostCard key={post.id} post={post} userId={user?.id ?? null} saved={savedIds.includes(post.id)} />
        ))}
      </div>

      <AppNav />
    </main>
  );
}
