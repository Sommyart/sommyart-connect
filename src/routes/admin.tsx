import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowDownAZ,
  Download,
  Loader2,
  LogOut,
  Megaphone,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { ActivitiesPanel } from "@/components/admin/ActivitiesPanel";
import { BirthdaysPanel } from "@/components/admin/BirthdaysPanel";
import { BusinessPostsPanel } from "@/components/admin/BusinessPostsPanel";
import { AttendancePanel } from "@/components/admin/AttendancePanel";
import { ContributionsPanel } from "@/components/admin/ContributionsPanel";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { WinnersPanel } from "@/components/admin/WinnersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { birthdayLabel, DAYS, MONTHS, type Member } from "@/lib/members";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AWKA CONNECT Admin" },
      { name: "description", content: "Private admin console for AWKA CONNECT organisers." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "AWKA CONNECT Admin" },
      { property: "og:description", content: "Private admin console for AWKA CONNECT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    supabase.rpc("claim_first_admin").then(({ data, error }) => {
      if (error) console.error(error);
      setIsAdmin(Boolean(data));
    });
  }, [session]);

  if (checking) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-primary h-7 w-7 animate-spin" aria-hidden />
      </main>
    );
  }

  if (!session) return <AdminLogin />;
  if (!isAdmin) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="text-muted-foreground h-10 w-10" aria-hidden />
        <p className="text-muted-foreground text-sm">
          This account does not have admin access to AWKA CONNECT.
        </p>
        <Button variant="secondary" className="rounded-2xl" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </main>
    );
  }

  return <AdminConsole email={session.user.email ?? ""} />;
}

const ADMIN_EMAILS = ["josiahbenmoshe@gmail.com", "janedan732@gmail.com"];

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
      toast.error("This email is not recognised as an AWKA CONNECT admin.");
      return;
    }
    setBusy(true);
    const creds = { email: email.trim().toLowerCase(), password };
    let { error } = await supabase.auth.signInWithPassword(creds);
    if (error) {
      // first-time sign in for a recognised admin creates the account instantly
      const { error: signUpError } = await supabase.auth.signUp(creds);
      if (!signUpError) ({ error } = await supabase.auth.signInWithPassword(creds));
      else error = signUpError;
    }
    if (error) toast.error(error.message);
    setBusy(false);
  }


  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="bg-card shadow-card animate-fade-up w-full max-w-sm rounded-3xl p-7">
        <Logo size={72} className="mx-auto h-16 w-16" />
        <h1 className="text-card-foreground mt-4 text-center text-xl font-extrabold">
          Admin access
        </h1>
        <p className="text-muted-foreground mt-1 text-center text-sm">AWKA CONNECT organisers only</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              className="h-12 rounded-2xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              className="h-12 rounded-2xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="press h-12 w-full rounded-2xl">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            Sign in
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Only the two recognised AWKA CONNECT admin emails can sign in here.
          </p>

        </form>
      </div>
    </main>
  );
}

function AdminConsole({ email }: { email: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sorted, setSorted] = useState(true);
  const [editing, setEditing] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [savingMsg, setSavingMsg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rows, error }, { data: ann }] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase
        .from("announcements")
        .select("id,message")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (error) toast.error(error.message);
    setMembers((rows as Member[]) ?? []);
    setMessage(ann?.message ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? members.filter((m) =>
          [m.real_name, m.nickname, m.occupation].some((v) => v.toLowerCase().includes(q)),
        )
      : members;
    return sorted ? [...list].sort((a, b) => a.real_name.localeCompare(b.real_name)) : list;
  }, [members, query, sorted]);

  async function saveAnnouncement() {
    if (!message.trim()) return;
    setSavingMsg(true);
    const { data: current } = await supabase
      .from("announcements")
      .select("id")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = current
      ? await supabase
          .from("announcements")
          .update({ message: message.trim(), updated_at: new Date().toISOString() })
          .eq("id", current.id)
      : await supabase.from("announcements").insert({ message: message.trim() });

    setSavingMsg(false);
    if (error) toast.error(error.message);
    else toast.success("Announcement published to everyone");
  }

  async function removeMember(m: Member) {
    if (!confirm(`Delete ${m.real_name}?`)) return;
    const { error } = await supabase.from("members").delete().eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (m.profile_picture) {
      await supabase.storage.from("profile-pictures").remove([m.profile_picture]);
    }
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    toast.success("Member deleted");
  }

  async function saveMember(updated: Member): Promise<void> {
    const { error } = await supabase
      .from("members")
      .update({
        real_name: updated.real_name,
        nickname: updated.nickname,
        birth_day: updated.birth_day,
        birth_month: updated.birth_month,
        occupation: updated.occupation,
      })
      .eq("id", updated.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditing(null);
    toast.success("Member updated");
  }

  function exportCsv() {
    const head = ["Real name", "Nickname", "Birth day", "Birth month", "Occupation", "Joined"];
    const rows = visible.map((m) => [
      m.real_name,
      m.nickname,
      String(m.birth_day),
      MONTHS[m.birth_month - 1] ?? "",
      m.occupation,
      new Date(m.created_at).toLocaleDateString(),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `awka-connect-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pt-6 pb-14 sm:px-6">
      <header className="flex items-center gap-3">
        <Logo size={44} className="h-11 w-11" />
        <div className="flex-1">
          <h1 className="text-foreground text-lg leading-tight font-extrabold">Admin console</h1>
          <p className="text-muted-foreground text-xs">{email}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="press rounded-xl"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="mr-1 h-4 w-4" aria-hidden /> Sign out
        </Button>
      </header>

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="bg-card/85 flex h-auto w-full flex-wrap justify-start gap-1.5 rounded-2xl p-2 backdrop-blur-xl">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Members
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="contributions" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Contributions
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Activities
          </TabsTrigger>
          <TabsTrigger value="winners" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Winners
          </TabsTrigger>
          <TabsTrigger value="birthdays" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Birthdays
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground grow rounded-xl px-3 py-2 text-xs font-semibold">
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-5 space-y-5">
          <DashboardPanel />
          <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
            <h2 className="text-card-foreground flex items-center gap-2 font-bold">
              <Megaphone className="text-primary h-5 w-5" aria-hidden /> Scrolling announcement
            </h2>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="mt-3 rounded-2xl"
            />
            <Button
              className="press mt-3 w-full rounded-2xl"
              disabled={savingMsg}
              onClick={() => void saveAnnouncement()}
            >
              {savingMsg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Publish announcement
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="members" className="mt-5">
          <section className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-card-foreground flex-1 font-bold">Members ({members.length})</h2>
              <Button
                variant="secondary"
                size="sm"
                className="press rounded-xl"
                onClick={() => setSorted((s) => !s)}
              >
                <ArrowDownAZ className="mr-1 h-4 w-4" aria-hidden /> {sorted ? "A–Z" : "Newest"}
              </Button>
              <Button variant="secondary" size="sm" className="press rounded-xl" onClick={exportCsv}>
                <Download className="mr-1 h-4 w-4" aria-hidden /> CSV
              </Button>
            </div>

            <div className="relative mt-3">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                placeholder="Search name, nickname or occupation"
                className="h-11 rounded-2xl pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-muted h-16 animate-pulse rounded-2xl" />
                ))
              ) : visible.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">No members yet.</p>
              ) : (
                visible.map((m) => (
                  <div
                    key={m.id}
                    className="bg-secondary flex items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-secondary-foreground truncate text-sm font-semibold">
                        {m.real_name} <span className="text-primary">“{m.nickname}”</span>
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {m.occupation} • {birthdayLabel(m.birth_day, m.birth_month)}
                      </p>
                    </div>
                    <button
                      aria-label={`Edit ${m.real_name}`}
                      className="press text-muted-foreground hover:text-primary p-2"
                      onClick={() => setEditing(m)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      aria-label={`Delete ${m.real_name}`}
                      className="press text-muted-foreground hover:text-destructive p-2"
                      onClick={() => void removeMember(m)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="attendance" className="mt-5">
          <AttendancePanel members={members} />
        </TabsContent>
        <TabsContent value="contributions" className="mt-5">
          <ContributionsPanel members={members} />
        </TabsContent>
        <TabsContent value="activities" className="mt-5">
          <ActivitiesPanel />
        </TabsContent>
        <TabsContent value="winners" className="mt-5">
          <WinnersPanel />
        </TabsContent>
        <TabsContent value="birthdays" className="mt-5">
          <BirthdaysPanel members={members} />
        </TabsContent>
        <TabsContent value="business" className="mt-5">
          <BusinessPostsPanel />
        </TabsContent>
      </Tabs>

      <EditDialog member={editing} onClose={() => setEditing(null)} onSave={saveMember} />
    </main>
  );
}


function EditDialog({
  member,
  onClose,
  onSave,
}: {
  member: Member | null;
  onClose: () => void;
  onSave: (m: Member) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Member | null>(member);
  useEffect(() => setDraft(member), [member]);

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
        </DialogHeader>
        {draft && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Real name</Label>
              <Input
                className="h-11 rounded-2xl"
                value={draft.real_name}
                onChange={(e) => setDraft({ ...draft, real_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nickname</Label>
              <Input
                className="h-11 rounded-2xl"
                value={draft.nickname}
                onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <select
                  className="border-input bg-background h-11 w-full rounded-2xl border px-3 text-sm"
                  value={draft.birth_day}
                  onChange={(e) => setDraft({ ...draft, birth_day: Number(e.target.value) })}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Month</Label>
                <select
                  className="border-input bg-background h-11 w-full rounded-2xl border px-3 text-sm"
                  value={draft.birth_month}
                  onChange={(e) => setDraft({ ...draft, birth_month: Number(e.target.value) })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Occupation</Label>
              <Input
                className="h-11 rounded-2xl"
                value={draft.occupation}
                onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" className="rounded-2xl" onClick={onClose}>
            Cancel
          </Button>
          <Button className="rounded-2xl" onClick={() => draft && void onSave(draft)}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
