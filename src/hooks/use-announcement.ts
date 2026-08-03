import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Announcement = { id: string; message: string; updated_at: string };

async function fetchLatest(): Promise<Announcement | null> {
  const { data } = await supabase
    .from("announcements")
    .select("id,message,updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Latest announcement, kept live via realtime + optional browser notification. */
export function useAnnouncement(notify = false) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let known: string | null = null;

    fetchLatest().then((a) => {
      if (!active) return;
      known = a?.message ?? null;
      setAnnouncement(a);
      setLoading(false);
    });

    const channel = supabase
      .channel("announcements-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const latest = await fetchLatest();
          if (!active) return;
          setAnnouncement(latest);
          if (
            notify &&
            latest?.message &&
            latest.message !== known &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("SOMMYART CONNECT", {
              body: latest.message,
              icon: "/icons/icon-192.png",
            });
          }
          known = latest?.message ?? null;
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [notify]);

  return { announcement, loading };
}
