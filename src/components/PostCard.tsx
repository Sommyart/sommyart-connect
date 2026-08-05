import { useState } from "react";
import { Bookmark, Flag, Heart, Loader2, MessageCircle, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Media, Avatar } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddComment,
  useDeletePost,
  usePostComments,
  useReportPost,
  useSavePost,
  useToggleReaction,
  type Post,
} from "@/hooks/use-feed";

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

export function PostCard({
  post,
  userId,
  saved,
}: {
  post: Post;
  userId: string | null;
  saved: boolean;
}) {
  const react = useToggleReaction();
  const save = useSavePost();
  const report = useReportPost();
  const remove = useDeletePost();
  const addComment = useAddComment();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const comments = usePostComments(open ? post.id : null);

  const liked = post.post_reactions.some((r) => r.user_id === userId);
  const mine = post.author_id === userId;

  async function share() {
    const url = `${window.location.origin}/feed#${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "SOMMYART CONNECT", text: post.content, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* dismissed */
    }
  }

  function submitReport() {
    if (!userId) return;
    report.mutate(
      { post_id: post.id, reporter_id: userId, reason: "inappropriate" },
      {
        onSuccess: () => toast.success("Reported — moderators will review this"),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <article
      id={post.id}
      className="bg-card/85 shadow-card border-border/60 animate-fade-up rounded-3xl border p-5 backdrop-blur-xl"
    >
      <header className="flex items-center gap-3">
        <Avatar path={post.profiles?.avatar_url} name={post.profiles?.full_name ?? "SC"} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-card-foreground truncate text-sm font-bold">
            {post.profiles?.full_name ?? "Member"}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            @{post.profiles?.username ?? "member"} • {timeAgo(post.created_at)}
          </p>
        </div>
        {mine && (
          <button
            aria-label="Delete post"
            className="press text-muted-foreground"
            onClick={() => remove.mutate(post.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        )}
      </header>

      {post.content && (
        <p className="text-card-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {post.media_urls.length > 0 && (
        <div
          className={`mt-3 grid gap-2 ${post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {post.media_urls.map((path) => (
            <Media
              key={path}
              path={path}
              alt="Post media"
              video={post.media_type === "video"}
              className="max-h-80 w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary mt-3 block truncate text-xs font-semibold underline"
        >
          {post.link_url}
        </a>
      )}

      <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs font-semibold">
        <button
          className="press flex items-center gap-1"
          aria-label="Like"
          onClick={() => userId && react.mutate({ postId: post.id, userId, on: !liked })}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} aria-hidden />
          {post.post_reactions.length}
        </button>
        <button className="press flex items-center gap-1" aria-label="Comments" onClick={() => setOpen((v) => !v)}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          {post.post_comments.length}
        </button>
        <button className="press flex items-center gap-1" aria-label="Share" onClick={() => void share()}>
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
        <button
          className="press flex items-center gap-1"
          aria-label="Bookmark"
          onClick={() => userId && save.mutate({ postId: post.id, userId, on: !saved })}
        >
          <Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} aria-hidden />
        </button>
        {!mine && (
          <button className="press ml-auto" aria-label="Report post" onClick={submitReport}>
            <Flag className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div className="border-border/60 mt-4 space-y-3 border-t pt-3">
          {comments.isLoading && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden />}
          {(comments.data ?? []).map((row) => {
            const author = (row as { profiles: { full_name: string; avatar_url: string | null } | null })
              .profiles;
            return (
              <div key={(row as { id: string }).id} className="flex gap-2">
                <Avatar path={author?.avatar_url} name={author?.full_name ?? "SC"} size={28} />
                <div className="bg-secondary min-w-0 flex-1 rounded-2xl px-3 py-2">
                  <p className="text-secondary-foreground text-xs font-bold">{author?.full_name ?? "Member"}</p>
                  <p className="text-secondary-foreground text-sm break-words">
                    {(row as { body: string }).body}
                  </p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Input
              className="rounded-2xl"
              placeholder="Write a comment…"
              aria-label="Write a comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button
              size="sm"
              className="press rounded-2xl"
              disabled={!userId || draft.trim().length < 2 || addComment.isPending}
              onClick={() =>
                userId &&
                addComment.mutate(
                  { post_id: post.id, author_id: userId, body: draft.trim() },
                  { onSuccess: () => setDraft("") },
                )
              }
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
