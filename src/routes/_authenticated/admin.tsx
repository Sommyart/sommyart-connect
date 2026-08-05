import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin, useMe } from "@/hooks/use-auth";
import {
  useAdminAnalytics,
  useAdminAudit,
  useAdminContent,
  useAdminMemberAction,
  useAdminMembers,
  useAdminReports,
  useDeleteContent,
  useResolveReport,
  useSaveContent,
} from "@/hooks/use-admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Moderation, member management, content scheduling, analytics and audit logs for SOMMYART CONNECT administrators.",
      },
      { property: "og:title", content: "Admin Console — SOMMYART CONNECT" },
      { property: "og:description", content: "Community administration tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "members" | "moderation" | "content" | "audit";
const TABS: Tab[] = ["overview", "members", "moderation", "content", "audit"];

function AdminPage() {
  const { user } = useMe();
  const { data: isAdmin, isLoading } = useIsAdmin(user);
  const [tab, setTab] = useState<Tab>("overview");

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-lg place-items-center px-5 text-center">
        <div>
          <ShieldCheck className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
          <p className="text-foreground mt-3 font-bold">Admins only</p>
          <p className="text-muted-foreground text-sm">This console is restricted to community admins.</p>
        </div>
        <AppNav />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground flex items-center gap-2 text-2xl font-extrabold">
        <ShieldCheck className="text-primary h-6 w-6" aria-hidden /> Admin console
      </h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={tab === value ? "default" : "secondary"}
            className="press rounded-xl capitalize"
            onClick={() => setTab(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "members" && <Members />}
      {tab === "moderation" && <Moderation />}
      {tab === "content" && <Content />}
      {tab === "audit" && <Audit />}

      <AppNav />
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-card/85 shadow-card border-border/60 mt-4 rounded-3xl border p-5 backdrop-blur-xl">
      {children}
    </section>
  );
}

function Overview() {
  const { data } = useAdminAnalytics(true);
  const stats = [
    ["Daily actives", data?.dau ?? 0],
    ["Weekly actives", data?.wau ?? 0],
    ["Monthly actives", data?.mau ?? 0],
    ["Members", data?.members ?? 0],
    ["Posts", data?.posts ?? 0],
    ["Projects", data?.projects ?? 0],
    ["Submissions", data?.submissions ?? 0],
    ["Games (7d)", data?.gamesThisWeek ?? 0],
  ] as const;

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-secondary rounded-2xl p-3">
            <p className="text-secondary-foreground text-2xl font-black">{value}</p>
            <p className="text-muted-foreground text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Members() {
  const [search, setSearch] = useState("");
  const { data: members = [], isLoading } = useAdminMembers(search, true);
  const action = useAdminMemberAction();

  return (
    <Card>
      <Input
        className="rounded-2xl"
        placeholder="Search members…"
        aria-label="Search members"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading && <div className="bg-muted mt-3 h-24 animate-pulse rounded-2xl" />}
      <div className="mt-3 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-secondary rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-secondary-foreground truncate text-sm font-bold">{m.full_name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  @{m.username} • {m.points} pts • {m.streak}🔥
                  {m.suspended ? " • suspended" : ""}
                </p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant={m.suspended ? "default" : "secondary"}
                className="press rounded-xl"
                onClick={() =>
                  action.mutate(
                    { userId: m.id, suspended: !m.suspended },
                    { onSuccess: () => toast.success(m.suspended ? "Unsuspended" : "Suspended") },
                  )
                }
              >
                {m.suspended ? "Unsuspend" : "Suspend"}
              </Button>
              <Button
                size="sm"
                variant={m.featured ? "default" : "secondary"}
                className="press rounded-xl"
                onClick={() => action.mutate({ userId: m.id, featured: !m.featured })}
              >
                {m.featured ? "Unfeature" : "Feature"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Moderation() {
  const { data: reports = [], isLoading } = useAdminReports(true);
  const resolve = useResolveReport();

  return (
    <Card>
      <h2 className="text-card-foreground text-lg font-extrabold">Reported posts</h2>
      {isLoading && <div className="bg-muted mt-3 h-24 animate-pulse rounded-2xl" />}
      {!isLoading && reports.length === 0 && (
        <p className="text-muted-foreground mt-3 text-sm">Nothing reported — the feed is clean.</p>
      )}
      <div className="mt-3 space-y-2">
        {reports.map((r) => {
          const post = (r as { posts: { content: string } | null }).posts;
          return (
            <div key={r.id} className="bg-secondary rounded-2xl p-3">
              <p className="text-muted-foreground text-xs font-bold uppercase">
                {r.reason} • {r.status}
              </p>
              <p className="text-secondary-foreground mt-1 line-clamp-3 text-sm">
                {post?.content ?? "Post deleted"}
              </p>
              {r.status === "open" && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="press rounded-xl"
                    onClick={() => resolve.mutate({ reportId: r.id, deletePost: false })}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="press rounded-xl"
                    onClick={() => resolve.mutate({ reportId: r.id, deletePost: true })}
                  >
                    Remove post
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const CONTENT_TABS = ["announcements", "challenges", "events", "rewards"] as const;
type ContentTable = (typeof CONTENT_TABS)[number];

function Content() {
  const [table, setTable] = useState<ContentTable>("announcements");
  const { data: rows = [] } = useAdminContent(table, true);
  const save = useSaveContent();
  const remove = useDeleteContent();
  const [draft, setDraft] = useState({ title: "", description: "", cost: "50" });

  function create() {
    const values: Record<string, unknown> =
      table === "announcements"
        ? { message: draft.description || draft.title, is_active: true }
        : table === "rewards"
          ? {
              title: draft.title,
              description: draft.description,
              cost: Number(draft.cost) || 50,
              is_active: true,
            }
          : table === "events"
            ? { title: draft.title, description: draft.description, kind: "monthly", is_active: true }
            : {
                title: draft.title,
                description: draft.description,
                kind: "weekly",
                is_active: true,
                starts_at: new Date().toISOString(),
              };

    save.mutate(
      { table, values },
      {
        onSuccess: () => {
          setDraft({ title: "", description: "", cost: "50" });
          toast.success("Saved");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap gap-2">
        {CONTENT_TABS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={table === t ? "default" : "secondary"}
            className="press rounded-xl capitalize"
            onClick={() => setTable(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {table !== "announcements" && (
          <Input
            className="rounded-2xl"
            placeholder="Title"
            aria-label="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        )}
        <Textarea
          className="rounded-2xl"
          rows={2}
          placeholder={table === "announcements" ? "Announcement message" : "Description"}
          aria-label="Description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        {table === "rewards" && (
          <Input
            className="rounded-2xl"
            type="number"
            placeholder="Cost in points"
            aria-label="Cost in points"
            value={draft.cost}
            onChange={(e) => setDraft({ ...draft, cost: e.target.value })}
          />
        )}
        <Button className="press w-full rounded-2xl" onClick={create} disabled={save.isPending}>
          Add {table.slice(0, -1)}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const item = row as Record<string, unknown>;
          const id = item["id"] as string;
          const label = (item["title"] as string) ?? (item["message"] as string) ?? "Item";
          const active = item["is_active"] as boolean | undefined;
          return (
            <div key={id} className="bg-secondary flex items-center gap-2 rounded-2xl p-3">
              <p className="text-secondary-foreground min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
              {active !== undefined && (
                <Button
                  size="sm"
                  variant={active ? "default" : "secondary"}
                  className="press rounded-xl"
                  onClick={() => save.mutate({ table, id, values: { is_active: !active } })}
                >
                  {active ? "Live" : "Off"}
                </Button>
              )}
              <button
                aria-label="Delete"
                className="press text-muted-foreground"
                onClick={() => remove.mutate({ table, id })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Audit() {
  const { data: rows = [] } = useAdminAudit(true);
  return (
    <Card>
      <h2 className="text-card-foreground text-lg font-extrabold">Audit log</h2>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-muted-foreground text-sm">No admin actions yet.</p>}
        {rows.map((row) => {
          const actor = (row as { profiles: { full_name: string } | null }).profiles;
          return (
            <div key={row.id} className="bg-secondary rounded-2xl p-3">
              <p className="text-secondary-foreground text-sm font-bold">{row.action}</p>
              <p className="text-muted-foreground text-xs">
                {actor?.full_name ?? "System"} • {new Date(row.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
