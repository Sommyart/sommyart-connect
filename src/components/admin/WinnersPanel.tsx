import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { lagosTodayClient } from "@/lib/admin-utils";
import type { Member } from "@/lib/members";
import type { Winner } from "@/lib/member-types";

export function WinnersPanel() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    activity: "",
    congratulation_message: "",
    date: lagosTodayClient(),
  });

  useEffect(() => {
    void (async () => {
      const [{ data, error }, { data: rows }] = await Promise.all([
        supabase
          .from("winners")
          .select("id,activity,winner_name,winner_image,congratulation_message,date")
          .order("date", { ascending: false }),
        supabase.from("members").select("*").order("real_name"),
      ]);
      if (error) toast.error(error.message);
      setWinners((data ?? []) as Winner[]);
      setMembers((rows as Member[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => `${m.real_name} ${m.nickname}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [members, query]);

  async function add() {
    if (!form.activity.trim() || !selected) {
      toast.error("Pick an activity and a member");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("winners")
      .insert({
        activity: form.activity.trim(),
        member_id: selected.id,
        winner_name: selected.nickname,
        winner_image: selected.profile_picture,
        congratulation_message: form.congratulation_message.trim() || null,
        date: form.date,
      })
      .select("id,activity,winner_name,winner_image,congratulation_message,date")
      .maybeSingle();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setWinners((prev) => [data as Winner, ...prev]);
    setSelected(null);
    setQuery("");
    setForm({
      activity: "",
      congratulation_message: "",
      date: lagosTodayClient(),
    });
    toast.success("Winner announced");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("winners").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setWinners((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <section className="space-y-4">
      <div className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
        <h2 className="text-card-foreground font-bold">Announce a winner</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Search a member — their latest profile picture is used automatically.
        </p>

        <div className="relative mt-3">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            placeholder="Search by nickname or real name"
            className="h-11 rounded-2xl pl-9"
            value={selected ? `${selected.real_name} (${selected.nickname})` : query}
            onChange={(e) => {
              setSelected(null);
              setQuery(e.target.value);
            }}
          />
        </div>
        {!selected && matches.length > 0 && (
          <div className="mt-2 space-y-1">
            {matches.map((m) => (
              <button
                key={m.id}
                className="bg-secondary hover:bg-muted flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-left"
                onClick={() => setSelected(m)}
              >
                <span className="text-secondary-foreground flex-1 truncate text-sm font-semibold">
                  {m.real_name} <span className="text-primary">“{m.nickname}”</span>
                </span>
                <Check className="text-muted-foreground h-4 w-4" aria-hidden />
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="w-activity">Activity / award (MCM, WCW…)</Label>
            <Input
              id="w-activity"
              className="h-11 rounded-2xl"
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-date">Date</Label>
            <Input
              id="w-date"
              type="date"
              className="h-11 rounded-2xl"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="w-msg">Congratulation message</Label>
          <Textarea
            id="w-msg"
            rows={2}
            className="rounded-2xl"
            value={form.congratulation_message}
            onChange={(e) => setForm({ ...form, congratulation_message: e.target.value })}
          />
        </div>
        <Button className="press mt-3 w-full rounded-2xl" disabled={busy} onClick={() => void add()}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="mr-2 h-4 w-4" aria-hidden />
          )}
          Publish winner
        </Button>
      </div>


      <div className="bg-card shadow-card rounded-3xl p-5">
        <h2 className="text-card-foreground font-bold">Published winners ({winners.length})</h2>
        <div className="mt-3 space-y-2">
          {loading && <div className="bg-muted h-16 animate-pulse rounded-2xl" />}
          {!loading && winners.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">No winners yet.</p>
          )}
          {winners.map((w) => (
            <div key={w.id} className="bg-secondary flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-secondary-foreground truncate text-sm font-semibold">
                  {w.winner_name} <span className="text-primary">• {w.activity}</span>
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {new Date(`${w.date}T12:00:00Z`).toLocaleDateString()}
                </p>
              </div>
              <button
                aria-label={`Delete winner ${w.winner_name}`}
                className="press text-muted-foreground hover:text-destructive p-2"
                onClick={() => void remove(w.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
