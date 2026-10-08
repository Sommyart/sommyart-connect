import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, Check, Handshake, Loader2, PenSquare, Search, X } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-auth";
import { startConversation, useConversations, useMemberSearch, usePendingCollabs, type MiniProfile } from "@/hooks/use-messages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — SOMMYART CONNECT" },
      { name: "description", content: "Private direct messages and collaboration requests with SOMMYART CONNECT creators." },
      { property: "og:title", content: "Messages — SOMMYART CONNECT" },
      { property: "og:description", content: "Private conversations with community creators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesLayout,
});

export function shortTime(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  if (mins < 10080) return `${Math.round(mins / 1440)}d`;
  return new Date(iso).toLocaleDateString();
}

function MessagesLayout() {
  const { user } = useMe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inConversation = /^\/messages\/[^/]+/.test(pathname);
  const activeId = inConversation ? pathname.split("/")[2] : null;
  const { data: convs = [], isLoading } = useConversations(user?.id);
  const [term, setTerm] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const navigate = useNavigate();
  const people = useMemberSearch(term.trim());
  const [opening, setOpening] = useState<string | null>(null);
  async function openChat(p: MiniProfile) {
    setOpening(p.id);
    try {
      const existing = convs.find((c) => c.other?.id === p.id);
      const id = existing?.id ?? (await startConversation(p.id));
      setTerm(""); setPickerOpen(false);
      void navigate({ to: "/messages/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open chat");
    } finally { setOpening(null); }
  }

  const contentHits = useQuery({
    queryKey: ["dm-search", term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("conversation_id").ilike("body", `%${term.trim()}%`).is("deleted_at", null).limit(200);
      return new Set((data ?? []).map((r) => r.conversation_id));
    },
  });

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return convs;
    return convs.filter(
      (c) =>
        c.other?.full_name.toLowerCase().includes(t) ||
        c.other?.username.toLowerCase().includes(t) ||
        c.last_message_preview?.toLowerCase().includes(t) ||
        contentHits.data?.has(c.id),
    );
  }, [convs, term, contentHits.data]);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-5xl flex-col px-0 pb-24 md:px-6 md:pt-6">
      <div className="bg-card border-border flex min-h-0 flex-1 overflow-hidden md:rounded-xl md:border">
        <aside className={`border-border flex w-full min-h-0 flex-col md:w-80 md:border-r ${inConversation ? "hidden md:flex" : "flex"}`}>
          <div className="border-border space-y-3 border-b p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-foreground text-xl font-extrabold">Messages</h1>
              <Button size="sm" onClick={() => setPickerOpen(true)}><PenSquare className="mr-1 h-4 w-4" /> New message</Button>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search people or messages" className="pl-9" />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CollabRequests userId={user?.id} />
            {isLoading && <div className="bg-muted m-4 h-16 animate-pulse rounded-lg" />}
            {term.trim().length >= 2 && filtered.length > 0 && <p className="text-muted-foreground px-4 pt-3 text-xs font-bold uppercase">Conversations</p>}
            {!isLoading && !filtered.length && !term.trim() && (
              <p className="text-muted-foreground p-6 text-center text-sm">
                {"No conversations yet. Open a member's profile and tap Send Message."}
              </p>
            )}
            {filtered.map((c) => (
              <Link key={c.id} to="/messages/$id" params={{ id: c.id }}
                className={`hover:bg-secondary/60 flex items-center gap-3 px-4 py-3 ${activeId === c.id ? "bg-secondary" : ""}`}>
                <Avatar path={c.other?.avatar_url} name={c.other?.full_name ?? "Member"} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${c.unread ? "text-foreground font-extrabold" : "text-foreground font-semibold"}`}>
                      {c.other?.full_name ?? "Member"}
                      {c.muted && <BellOff className="text-muted-foreground ml-1 inline h-3 w-3" aria-label="Muted" />}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-[11px]">{shortTime(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-xs ${c.unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {c.last_sender_id === user?.id ? "You: " : ""}{c.last_message_preview || "Say hello"}
                    </p>
                    {c.unread > 0 && (
                      <span className="bg-primary text-primary-foreground min-w-5 shrink-0 rounded-full px-1.5 text-center text-[10px] leading-5 font-bold">
                        {c.unread > 99 ? "99+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {term.trim().length >= 1 && (
              <PeopleList people={(people.data ?? []).filter((p) => !filtered.some((c) => c.other?.id === p.id))} loading={people.isLoading} opening={opening} onPick={openChat} empty={!filtered.length} />
            )}
          </div>
        </aside>
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New message</DialogTitle></DialogHeader>
            <MemberPicker onPick={openChat} opening={opening} />
          </DialogContent>
        </Dialog>
        <section className={`min-h-0 flex-1 flex-col ${inConversation ? "flex" : "hidden md:flex"}`}>
          <Outlet />
        </section>
      </div>
      <AppNav />
    </main>
  );
}

function PeopleRow({ p, onPick, opening }: { p: MiniProfile; onPick: (p: MiniProfile) => void; opening: string | null }) {
  return (
    <button type="button" onClick={() => onPick(p)} disabled={opening === p.id}
      className="hover:bg-secondary/60 flex w-full items-center gap-3 px-4 py-2.5 text-left">
      <Avatar path={p.avatar_url} name={p.full_name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{p.full_name}</p>
        <p className="text-muted-foreground truncate text-xs">@{p.username}</p>
      </div>
      {opening === p.id && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
    </button>
  );
}

function PeopleList({ people, loading, opening, onPick, empty }: { people: MiniProfile[]; loading: boolean; opening: string | null; onPick: (p: MiniProfile) => void; empty: boolean }) {
  return (
    <div className="pb-2">
      <p className="text-muted-foreground px-4 pt-3 pb-1 text-xs font-bold uppercase">People</p>
      {loading && <Loader2 className="text-muted-foreground mx-auto my-3 h-4 w-4 animate-spin" />}
      {!loading && !people.length && (
        <p className="text-muted-foreground px-4 py-2 text-sm">{empty ? "No members or conversations match your search." : "No other members match."}</p>
      )}
      {people.map((p) => <PeopleRow key={p.id} p={p} onPick={onPick} opening={opening} />)}
    </div>
  );
}

function MemberPicker({ onPick, opening }: { onPick: (p: MiniProfile) => void; opening: string | null }) {
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useMemberSearch(q.trim());
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members by name or username" className="pl-9" />
      </div>
      <div className="-mx-4 max-h-80 overflow-y-auto">
        {isLoading && <Loader2 className="text-muted-foreground mx-auto my-4 h-5 w-5 animate-spin" />}
        {!isLoading && !data.length && <p className="text-muted-foreground px-4 py-4 text-center text-sm">No members found.</p>}
        {data.map((p) => <PeopleRow key={p.id} p={p} onPick={onPick} opening={opening} />)}
      </div>
    </div>
  );
}

function CollabRequests({ userId }: { userId?: string }) {
  const { data = [] } = usePendingCollabs(userId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (!data.length) return null;
  async function respond(id: string, accept: boolean) {
    const { data: conv, error } = await supabase.rpc("respond_collaboration", { _id: id, _accept: accept });
    if (error) return toast.error(error.message);
    void queryClient.invalidateQueries({ queryKey: ["collabs"] });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    toast.success(accept ? "Collaboration started" : "Request declined");
    if (accept && conv) void navigate({ to: "/messages/$id", params: { id: conv as string } });
  }
  return (
    <div className="border-border space-y-2 border-b p-3">
      <p className="text-muted-foreground flex items-center gap-1 text-xs font-bold uppercase"><Handshake className="h-3.5 w-3.5" /> Collaboration requests</p>
      {data.map((r) => (
        <div key={r.id} className="bg-secondary/60 rounded-lg p-3">
          <p className="text-sm font-bold">{r.profiles?.full_name} <span className="text-muted-foreground font-normal">· {r.category}</span></p>
          <p className="text-foreground text-sm">{r.topic}</p>
          {r.message && <p className="text-muted-foreground mt-1 text-xs">{r.message}</p>}
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => void respond(r.id, true)}><Check className="mr-1 h-4 w-4" /> Accept</Button>
            <Button size="sm" variant="outline" onClick={() => void respond(r.id, false)}><X className="mr-1 h-4 w-4" /> Decline</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
