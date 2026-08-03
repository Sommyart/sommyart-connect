import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { Avatar } from "@/components/Media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { levelFor } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Manage your SOMMYART CONNECT creator profile: bio, occupation, phone and community level.",
      },
      { property: "og:title", content: "My Profile — SOMMYART CONNECT" },
      { property: "og:description", content: "Your creator profile and community level." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useMe();
  const [form, setForm] = useState({ occupation: "", bio: "", phone: "" });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!touched && profile) {
    setTouched(true);
    setForm({
      occupation: profile.occupation ?? "",
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
    });
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth" });
  }

  const level = levelFor(profile?.points ?? 0);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">My profile</h1>

      {loading && <div className="bg-muted mt-4 h-40 animate-pulse rounded-3xl" />}

      {profile && (
        <>
          <section className="bg-card/85 shadow-card border-border/60 mt-4 rounded-3xl border p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <Avatar path={profile.avatar_url} name={profile.full_name} size={64} />
              <div className="min-w-0">
                <p className="text-card-foreground truncate text-lg font-extrabold">
                  {profile.full_name}
                </p>
                <p className="text-muted-foreground truncate text-sm">@{profile.username}</p>
                <p className="text-primary mt-1 text-xs font-bold">
                  {level.icon} {level.name} • {profile.points} pts
                </p>
              </div>
            </div>
            <div className="bg-secondary mt-4 h-1.5 overflow-hidden rounded-full">
              <div className="bg-gradient-brand h-full" style={{ width: `${level.progress}%` }} />
            </div>
          </section>

          <section className="bg-card/85 shadow-card border-border/60 mt-4 space-y-2 rounded-3xl border p-5 backdrop-blur-xl">
            <label className="text-muted-foreground text-xs font-bold uppercase" htmlFor="occ">
              Occupation
            </label>
            <Input
              id="occ"
              className="h-11 rounded-2xl"
              value={form.occupation}
              onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
            />
            <label className="text-muted-foreground text-xs font-bold uppercase" htmlFor="phone">
              Phone
            </label>
            <Input
              id="phone"
              className="h-11 rounded-2xl"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <label className="text-muted-foreground text-xs font-bold uppercase" htmlFor="bio">
              Bio
            </label>
            <Textarea
              id="bio"
              rows={3}
              className="rounded-2xl"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
            <Button
              className="press mt-2 h-11 w-full rounded-2xl"
              disabled={saving}
              onClick={() => void save()}
            >
              <Save className="mr-1 h-4 w-4" aria-hidden /> Save changes
            </Button>
          </section>

          <Button
            variant="secondary"
            className="press mt-3 h-11 w-full rounded-2xl"
            onClick={() => void signOut()}
          >
            <LogOut className="mr-1 h-4 w-4" aria-hidden /> Sign out
          </Button>
        </>
      )}

      <AppFooter />
      <AppNav />
    </main>
  );
}
