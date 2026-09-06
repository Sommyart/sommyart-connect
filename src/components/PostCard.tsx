import { useState } from "react";
import {
  Bookmark,
  Flag,
  Heart,
  Linkedin,
  Loader2,
  MessageCircle,
  Share2,
  Star,
  Trash2,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

import { Media, Avatar } from "@/components/Media";
import { AdminBadge } from "@/components/AdminBadge";
import { MentionInput, RichText } from "@/components/MentionInput";
import { Button } from "@/components/ui/button";
import {
  threadComments,
  useAddComment,
  useDeletePost,
  useFollow,
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
  const { following, toggle: toggleFollow } = useFollow(userId);
  const [open, setOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const comments = usePostComments(open ? post.id : null);

  const liked = post.post_reactions.some((r) => r.user_id === userId);
  const mine = post.author_id === userId;
  const isFollowing = following.includes(post.author_id);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/feed#${post.id}`;
  const shareText = post.content.slice(0, 160) || "Check out this SOMMYART CONNECT project";

  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title: "SOMMYART CONNECT", text: shareText, url: shareUrl });
      else {
        await navigator.clipboard.writeText(shareUrl);
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

  function send() {
    if (!userId) return;
    addComment.mutate(
      {
        post_id: post.id,
        author_id: userId,
        body: draft.trim(),
        parent_id: replyTo?.id ?? null,
      },
      {
        onSuccess: () => {
          setDraft("");
          setReplyTo(null);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  const threads = threadComments(comments.data ?? []);

  return (
    <article
      id={post.id}
      className="bg-card/85 shadow-card border-border/60 animate-fade-up rounded-3xl border p-5 backdrop-blur-xl"
    >
      <header className="flex items-center gap-3">
        <Avatar path={post.profiles?.avatar_url} name={post.profiles?.full_name ?? "SC"} size={40} />
        <div className="min-w-0 flex-1">
            <p className="text-card-foreground flex items-center gap-1.5 truncate text-sm font-bold">
              <span className="truncate">{post.profiles?.full_name ?? "Member"}</span>
              {post.profiles?.is_admin && <AdminBadge compact />}
            </p>
          <p className="text-muted-foreground truncate text-xs">
            @{post.profiles?.username ?? "member"} • {timeAgo(post.created_at)}
          </p>
        </div>
        {!mine && userId && (
          <button
            aria-label={isFollowing ? "Unfavourite creator" : "Favourite creator"}
            title={isFollowing ? "Unfavourite creator" : "Favourite creator — get notified of new posts"}
            className="press text-muted-foreground"
            onClick={() =>
              toggleFollow.mutate(
                { targetId: post.author_id, on: !isFollowing },
                {
                  onSuccess: () =>
                    toast.success(
                      isFollowing ? "Removed from favourites" : "Favourited — you'll be notified of new posts",
                    ),
                  onError: (e) => toast.error(e.message),
                },
              )
            }
          >
            <Star className={`h-4 w-4 ${isFollowing ? "fill-primary text-primary" : ""}`} aria-hidden />
          </button>
        )}
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
        <RichText text={post.content} className="text-card-foreground mt-3 text-sm leading-relaxed" />
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
        <button
          className="press flex items-center gap-1"
          aria-label="Share"
          onClick={() => setShowShare((v) => !v)}
        >
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

      {showShare && (
        <div className="border-border/60 mt-3 flex flex-wrap gap-2 border-t pt-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="press bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold"
          >
            <Twitter className="h-4 w-4" aria-hidden /> Share on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="press bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold"
          >
            <Linkedin className="h-4 w-4" aria-hidden /> Share on LinkedIn
          </a>
          <button
            className="press bg-secondary text-secondary-foreground flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold"
            onClick={() => void nativeShare()}
          >
            <Share2 className="h-4 w-4" aria-hidden /> More
          </button>
        </div>
      )}

      {open && (
        <div className="border-border/60 mt-4 space-y-3 border-t pt-3">
          {comments.isLoading && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden />}
          {threads.map((thread) => (
            <div key={thread.id} className="space-y-2">
              <CommentRow
                comment={thread}
                onReply={() => setReplyTo({ id: thread.id, name: thread.profiles?.username ?? "member" })}
              />
              {thread.replies.length > 0 && (
                <div className="border-border/60 ml-9 space-y-2 border-l pl-3">
                  {thread.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      onReply={() => setReplyTo({ id: thread.id, name: reply.profiles?.username ?? "member" })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {replyTo && (
            <p className="text-muted-foreground text-xs font-semibold">
              Replying to @{replyTo.name}{" "}
              <button className="text-primary press underline" onClick={() => setReplyTo(null)}>
                cancel
              </button>
            </p>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <MentionInput
                ariaLabel="Write a comment"
                placeholder={replyTo ? "Write a reply… use @ to mention" : "Write a comment… use @ to mention"}
                value={draft}
                onChange={setDraft}
              />
            </div>
            <Button
              size="sm"
              className="press h-10 rounded-2xl"
              disabled={!userId || draft.trim().length < 2 || addComment.isPending}
              onClick={send}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentRow({
  comment,
  onReply,
}: {
  comment: { id: string; body: string; profiles: { full_name: string; avatar_url: string | null; is_admin?: boolean } | null };
  onReply: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Avatar path={comment.profiles?.avatar_url} name={comment.profiles?.full_name ?? "SC"} size={28} />
      <div className="bg-secondary min-w-0 flex-1 rounded-2xl px-3 py-2">
        <p className="text-secondary-foreground flex items-center gap-1.5 text-xs font-bold">
          {comment.profiles?.full_name ?? "Member"}
          {comment.profiles?.is_admin && <AdminBadge compact />}
        </p>
        <RichText text={comment.body} className="text-secondary-foreground text-sm break-words" />
        <button className="press text-muted-foreground mt-1 text-[11px] font-bold" onClick={onReply}>
          Reply
        </button>
      </div>
    </div>
  );
}
