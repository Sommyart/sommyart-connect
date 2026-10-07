import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Loader2, ShieldCheck, Trash2 } from "lucide-react";
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
  useAdminQuizQuestions,
  useAdminReports,
  useDeleteQuizQuestion,
  useDeleteContent,
  useResolveReport,
  useSaveContent,
  useSaveQuizQuestion,
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

type Tab = "overview" | "members" | "moderation" | "safety" | "content" | "quiz" | "audit";
const TABS: Tab[] = ["overview", "members", "moderation", "safety", "content", "quiz", "audit"];

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
      <main className="mx-auto grid min-h-dvh w-full max-w-lg place-items-center px-5 text-center md:max-w-3xl">
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
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
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
      {tab === "safety" && <MessagingSafety />}
      {tab === "content" && <Content />}
      {tab === "quiz" && <QuizManager />}
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
                  @{m.username} • {m.points} pts • <Flame className="inline h-3 w-3" aria-hidden /> {m.streak}
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

function QuizManager() {
  const { data: questions = [] } = useAdminQuizQuestions(true);
  const save = useSaveQuizQuestion();
  const remove = useDeleteQuizQuestion();
  const [draft, setDraft] = useState({
    category: "AI",
    difficulty: "easy" as "easy" | "medium" | "hard",
    question: "",
    options: "",
    answer: "0",
  });

  function create() {
    const options = draft.options.split("|").map((item) => item.trim()).filter(Boolean);
    const answer = Number(draft.answer);
    if (options.length < 2 || !draft.question.trim() || !Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      toast.error("Add a question, options separated by |, and a valid answer number");
      return;
    }
    save.mutate(
      { category: draft.category.trim(), difficulty: draft.difficulty, question: draft.question.trim(), options, answer },
      {
        onSuccess: () => {
          setDraft({ category: "AI", difficulty: "easy", question: "", options: "", answer: "0" });
          toast.success("Quiz question added");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card>
      <h2 className="text-card-foreground text-lg font-extrabold">Quiz question bank</h2>
      <p className="text-muted-foreground mt-1 text-xs">Use | between answer options. Answer number starts at 0.</p>
      <div className="mt-3 space-y-2">
        <Input className="rounded-2xl" placeholder="Category" aria-label="Quiz category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <select className="bg-secondary text-secondary-foreground h-10 w-full rounded-2xl px-3 text-sm" aria-label="Quiz difficulty" value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as "easy" | "medium" | "hard" })}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <Textarea className="rounded-2xl" rows={2} placeholder="Question" aria-label="Quiz question" value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
        <Input className="rounded-2xl" placeholder="Option one | Option two | Option three" aria-label="Quiz options" value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} />
        <Input className="rounded-2xl" type="number" min={0} placeholder="Correct answer number" aria-label="Correct answer number" value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
        <Button className="press w-full rounded-2xl" onClick={create} disabled={save.isPending}>Add question</Button>
      </div>
      <div className="mt-4 space-y-2">
        {questions.map((question) => (
          <div key={question.id} className="bg-secondary flex items-start gap-2 rounded-2xl p-3">
            <div className="min-w-0 flex-1">
              <p className="text-secondary-foreground text-sm font-semibold">{question.question}</p>
              <p className="text-muted-foreground mt-1 text-xs">{question.category} • {question.difficulty} • {question.is_active ? "Live" : "Off"}</p>
            </div>
            <button aria-label={`Delete quiz question ${question.question}`} className="press text-muted-foreground" onClick={() => remove.mutate(question.id)}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MessagingSafety() {
  const stats = useQuery({
    queryKey: ["admin-messaging-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_messaging_stats");
      if (error) throw error;
      return data as {
        conversations: number; messages_today: number; active_today: number; collab_pending: number;
        collab_total: number; reports_open: number; daily: { day: string; count: number }[];
      };
    },
  });
  const reports = useQuery({
    queryKey: ["admin-user-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_reports")
        .select("*, reporter:reporter_id(username), reported:reported_id(username,full_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []) as unknown as {
        id: string; reason: string; details: string | null; status: string; created_at: string;
        reporter: { username: string } | null; reported: { username: string; full_name: string } | null;
      }[];
    },
  });
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("user_reports").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    void reports.refetch();
    void stats.refetch();
  }
  const s = stats.data;
  const max = Math.max(1, ...(s?.daily ?? []).map((d) => d.count));
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          ["Total conversations", s?.conversations],
          ["Daily active messengers", s?.active_today],
          ["Messages today", s?.messages_today],
          ["Collab requests", s?.collab_total],
          ["Pending collabs", s?.collab_pending],
          ["Open user reports", s?.reports_open],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-card border-border rounded-xl border p-4">
            <p className="text-2xl font-black">{(value as number | undefined) ?? "—"}</p>
            <p className="text-muted-foreground text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border-border rounded-xl border p-4">
        <p className="mb-3 text-sm font-bold">Messages — last 7 days</p>
        <div className="flex h-28 items-end gap-2">
          {(s?.daily ?? []).map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="bg-primary w-full rounded-t" style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }} />
              <span className="text-muted-foreground text-[10px]">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">Admins see activity totals only — private message contents are never shown.</p>
      </div>
      <div className="bg-card border-border rounded-xl border p-4">
        <p className="mb-3 text-sm font-bold">User reports</p>
        {!reports.data?.length && <p className="text-muted-foreground text-sm">No reports.</p>}
        <div className="space-y-2">
          {(reports.data ?? []).map((r) => (
            <div key={r.id} className="border-border rounded-lg border p-3 text-sm">
              <p className="font-bold">{r.reported?.full_name} <span className="text-muted-foreground font-normal">@{r.reported?.username}</span></p>
              <p><span className="text-destructive font-semibold">{r.reason}</span> · reported by @{r.reporter?.username} · {new Date(r.created_at).toLocaleDateString()}</p>
              {r.details && <p className="text-muted-foreground mt-1">{r.details}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-secondary rounded-full px-2 py-0.5 text-xs font-bold capitalize">{r.status}</span>
                {r.status === "open" && (
                  <>
                    <Button size="sm" onClick={() => void setStatus(r.id, "resolved")}>Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => void setStatus(r.id, "dismissed")}>Dismiss</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
