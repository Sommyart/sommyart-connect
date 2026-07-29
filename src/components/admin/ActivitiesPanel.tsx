import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { DAY_NAMES, type Activity } from "@/lib/member-types";

export function ActivitiesPanel() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id,day,title,description,image,is_active")
        .order("day");
      if (error) toast.error(error.message);
      setItems((data ?? []) as Activity[]);
      setLoading(false);
    })();
  }, []);

  async function save(a: Activity) {
    setSavingId(a.id);
    const { error } = await supabase
      .from("activities")
      .update({
        title: a.title,
        description: a.description,
        is_active: a.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`${DAY_NAMES[a.day]} activity updated`);
  }

  if (loading) return <div className="bg-muted h-40 animate-pulse rounded-3xl" />;

  return (
    <section className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="bg-card shadow-card animate-fade-up rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-primary text-xs font-extrabold tracking-widest uppercase">
              {DAY_NAMES[a.day]}
            </span>
            <div className="flex-1" />
            <Switch
              aria-label={`Show ${DAY_NAMES[a.day]} activity`}
              checked={a.is_active}
              onCheckedChange={(v) =>
                setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: v } : x)))
              }
            />
          </div>
          <Input
            aria-label={`${DAY_NAMES[a.day]} title`}
            className="mt-3 h-11 rounded-2xl"
            value={a.title}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)),
              )
            }
          />
          <Textarea
            aria-label={`${DAY_NAMES[a.day]} description`}
            rows={2}
            className="mt-2 rounded-2xl"
            value={a.description}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((x) => (x.id === a.id ? { ...x, description: e.target.value } : x)),
              )
            }
          />
          <Button
            size="sm"
            className="press mt-3 rounded-xl"
            disabled={savingId === a.id}
            onClick={() => void save(a)}
          >
            {savingId === a.id ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="mr-1 h-4 w-4" aria-hidden />
            )}
            Save
          </Button>
        </div>
      ))}
    </section>
  );
}
