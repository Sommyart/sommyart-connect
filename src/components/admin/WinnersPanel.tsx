import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { lagosTodayClient } from "@/lib/admin-utils";
import type { Winner } from "@/lib/member-types";

export function WinnersPanel() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    activity: "",
    winner_name: "",
    congratulation_message: "",
    date: lagosTodayClient(),
  });

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("winners")
        .select("id,activity,winner_name,winner_image,congratulation_message,date")
        .order("date", { ascending: false });
      if (error) toast.error(error.message);
      setWinners((data ?? []) as Winner[]);
      setLoading(false);
    })();
  }, []);

  async function add() {
    if (!form.activity.trim() || !form.winner_name.trim()) {
      toast.error("Activity and winner name are required");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("winners")
      .insert({
        activity: form.activity.trim(),
        winner_name: form.winner_name.trim(),
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
    setForm({
      activity: "",
      winner_name: "",
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="w-activity">Activity</Label>
            <Input
              id="w-activity"
              className="h-11 rounded-2xl"
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-name">Winner name</Label>
            <Input
              id="w-name"
              className="h-11 rounded-2xl"
              value={form.winner_name}
              onChange={(e) => setForm({ ...form, winner_name: e.target.value })}
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
