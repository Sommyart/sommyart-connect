import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AtSign, Bell, CheckCheck, Heart, Loader2, MessageCircle, RefreshCw, Sparkles, Trash2, UserPlus } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-auth";
import {
  groupByDay,
  useClearNotifications,
  useMarkNotifications,
  useNotifications,
  type NotificationFilter,
} from "@/hooks/use-notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Your SOMMYART CONNECT notification centre: new posts from favourite creators, mentions, replies, likes and followers.",
      },
      { property: "og:title", content: "Notifications — SOMMYART CONNECT" },
      { property: "og:description", content: "Stay on top of mentions, replies and creators you follow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "post", label: "Creators" },
  { key: "mention", label: "Mentions" },
  { key: "comment", label: "Replies" },
  { key: "like", label: "Likes" },
  { key: "follow", label: "Followers" },
];

function iconFor(kind: string) {
  if (kind === "mention") return AtSign;
  if (kind === "like") return Heart;
  if (kind === "follow") return UserPlus;
  if (kind === "comment" || kind === "reply") return MessageCircle;
  return Sparkles;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function notificationTarget(link: string | null) {
  if (!link) return null;
  const [path, hash] = link.split("#");
  if (path === "/feed") return { to: "/feed" as const, hash: hash || undefined };
  if (path === "/projects") return { to: "/projects" as const };
  if (path === "/profile") return { to: "/profile" as const };
  if (path === "/games") return { to: "/games" as const };
  if (path === "/leaderboard") return { to: "/leaderboard" as const };
  return { to: "/feed" as const };
}

function NotificationsPage() {
  const { user } = useMe();
  const navigate = useNavigate();
  const { data = [], isLoading, isFetching, refetch } = useNotifications(user?.id);
  const mark = useMarkNotifications(user?.id);
  const clear = useClearNotifications(user?.id);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const visible = data.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    if (filter === "comment") return n.kind === "comment" || n.kind === "reply";
    return n.kind === filter;
  });
  const unread = data.filter((n) => !n.is_read).length;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
      <div className="flex items-center gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-2xl font-extrabold">
          <Bell className="text-primary h-6 w-6" aria-hidden /> Notifications
        </h1>
        {unread > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-extrabold">
            {unread}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={filter === item.key ? "default" : "secondary"}
            className="press shrink-0 rounded-xl"
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="press rounded-xl"
          aria-label="Refresh notifications"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="mr-1 h-4 w-4" aria-hidden />}
          Refresh
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="press rounded-xl"
          disabled={!unread || mark.isPending}
          onClick={() => mark.mutate({ all: true })}
        >
          <CheckCheck className="mr-1 h-4 w-4" aria-hidden /> Mark all read
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="press rounded-xl"
          disabled={!data.length || clear.isPending}
          onClick={() => clear.mutate()}
        >
          <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Clear
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground mt-6 text-sm">Loading…</p>}
      {!isLoading && visible.length === 0 && (
        <section className="bg-card/85 shadow-card border-border/60 mt-5 rounded-3xl border p-8 text-center backdrop-blur-xl">
          <Bell className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
          <p className="text-card-foreground mt-3 font-bold">Nothing here yet</p>
          <p className="text-muted-foreground text-sm">
            Favourite creators from the feed to get notified when they post.
          </p>
        </section>
      )}

      {groupByDay(visible).map(([label, items]) => (
        <section key={label} className="mt-5">
          <p className="text-muted-foreground text-xs font-extrabold tracking-wide uppercase">{label}</p>
          <div className="mt-2 space-y-2">
            {items.map((item) => {
              const Icon = iconFor(item.kind);
              return (
                <button
                  key={item.id}
                  className={`press flex w-full items-start gap-3 rounded-2xl border p-3 text-left ${
                    item.is_read ? "border-border/60 bg-card/70" : "border-primary/40 bg-primary/10"
                  }`}
                  onClick={() => {
                    if (!item.is_read) mark.mutate({ ids: [item.id] });
                    const target = notificationTarget(item.link);
                    if (target) void navigate(target);
                  }}
                >
                  <span className="bg-gradient-brand text-primary-foreground mt-0.5 rounded-xl p-2">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-card-foreground block text-sm font-bold">{item.title}</span>
                    {item.body && (
                      <span className="text-muted-foreground block truncate text-xs">{item.body}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-[11px] font-semibold">
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <AppNav />
    </main>
  );
}
