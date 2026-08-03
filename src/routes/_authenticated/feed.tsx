import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-auth";
import { useCreatePost, useFeed, useToggleReaction } from "@/hooks/use-feed";

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
  const createPost = useCreatePost();
  const react = useToggleReaction();
  const [content, setContent] = useState("");

  function publish() {
    if (!user || content.trim().length < 3) return;
    createPost.mutate(
      { author_id: user.id, content: content.trim() },
      {
        onSuccess: () => {
          setContent("");
          toast.success("Posted to the community");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">Community feed</h1>

      <section className="bg-card/85 shadow-card border-border/60 mt-4 rounded-3xl border p-4 backdrop-blur-xl">
        <Textarea
          aria-label="Share an update"
          rows={3}
          className="rounded-2xl"
          placeholder="Share a win, a question or what you're building…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          className="press mt-3 h-11 w-full rounded-2xl"
          disabled={createPost.isPending || content.trim().length < 3}
          onClick={publish}
        >
          <Send className="mr-1 h-4 w-4" aria-hidden /> Post
        </Button>
      </section>

      <div className="mt-5 space-y-3">
        {isLoading && <div className="bg-muted h-32 animate-pulse rounded-3xl" />}
        {!isLoading && posts.length === 0 && (
          <p className="text-muted-foreground text-sm">No posts yet — start the first discussion.</p>
        )}
        {posts.map((post) => {
          const liked = post.post_reactions.some((r) => r.user_id === user?.id);
          return (
            <article
              key={post.id}
              className="bg-card/85 shadow-card border-border/60 animate-fade-up rounded-3xl border p-5 backdrop-blur-xl"
            >
              <header className="flex items-center gap-3">
                <Avatar path={post.profiles?.avatar_url} name={post.profiles?.full_name ?? "SC"} size={40} />
                <div className="min-w-0">
                  <p className="text-card-foreground truncate text-sm font-bold">
                    {post.profiles?.full_name ?? "Member"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    @{post.profiles?.username ?? "member"}
                  </p>
                </div>
              </header>
              <p className="text-card-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
              <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs font-semibold">
                <button
                  className="press flex items-center gap-1"
                  onClick={() =>
                    user && react.mutate({ postId: post.id, userId: user.id, on: !liked })
                  }
                >
                  <Heart
                    className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`}
                    aria-hidden
                  />
                  {post.post_reactions.length}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {post.post_comments.length}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <AppNav />
    </main>
  );
}
