import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, Crown, Download, Footprints, Flame, Loader2, LogOut, Medal, MessageCircle, Rocket, Save, ShieldAlert, ShieldCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import { MediaGallery } from "@/components/MediaGallery";
import { ProfilePhotos } from "@/components/ProfilePhotos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin, useMe } from "@/hooks/use-auth";
import { AdminBadge } from "@/components/AdminBadge";
import { useCheckInStats } from "@/hooks/use-checkin";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount, exportMyData, setDeactivated } from "@/lib/account.functions";
import { badgesFor } from "@/lib/badges";
import { levelFor } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Manage your SOMMYART CONNECT creator profile: photos, bio, social links, badges, notifications and account settings.",
      },
      { property: "og:title", content: "My Profile — SOMMYART CONNECT" },
      { property: "og:description", content: "Your creator profile, badges and account settings." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Tab = "profile" | "media" | "badges" | "account";

function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useMe();
  const { data: checkIns } = useCheckInStats(Boolean(user));
  const { data: isAdmin } = useIsAdmin(user);
  const [tab, setTab] = useState<Tab>("profile");

  const counts = useQuery({
    queryKey: ["my-content-counts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [posts, projects] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("owner_id", user!.id),
      ]);
      return { posts: posts.count ?? 0, projects: projects.count ?? 0 };
    },
  });

  async function patchProfile(patch: Record<string, unknown>) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  const level = levelFor(profile?.points ?? 0);
  const badges = badgesFor({
    points: profile?.points ?? 0,
    streak: checkIns?.currentStreak ?? 0,
    longestStreak: checkIns?.longestStreak ?? 0,
    totalSignIns: checkIns?.total ?? 0,
    posts: counts.data?.posts ?? 0,
    projects: counts.data?.projects ?? 0,
  });
  const badgeIcons = { footprints: Footprints, flame: Flame, star: Star, crown: Crown, message: MessageCircle, rocket: Rocket, "medal-bronze": Medal, "medal-silver": Medal, "medal-gold": Award } as const;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32">
      <h1 className="text-foreground text-2xl font-extrabold">My profile</h1>

      {loading && <div className="bg-muted mt-4 h-40 animate-pulse rounded-3xl" />}

      {user && profile && (
        <>
          <div className="mt-4">
            <ProfilePhotos
              userId={user.id}
              name={profile.full_name}
              avatarPath={profile.avatar_url}
              coverPath={(profile as unknown as { cover_url: string | null }).cover_url ?? null}
              onChange={async (patch) => {
                await patchProfile(patch);
              }}
            />
          </div>

          <section className="bg-card/85 shadow-card border-border/60 mt-4 rounded-3xl border p-5 backdrop-blur-xl">
            <p className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
              {profile.full_name} {isAdmin && <AdminBadge />}
            </p>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            <p className="text-primary mt-1 text-xs font-bold">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden /> {level.name} • {profile.points} pts
            </p>
            <div className="bg-secondary mt-3 h-1.5 overflow-hidden rounded-full">
              <div className="bg-gradient-brand h-full" style={{ width: `${level.progress}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <MiniStat label="Streak" value={checkIns?.currentStreak ?? 0} />
              <MiniStat label="Sign-ins" value={checkIns?.total ?? 0} />
              <MiniStat label="Posts" value={counts.data?.posts ?? 0} />
              <MiniStat label="Projects" value={counts.data?.projects ?? 0} />
            </div>
          </section>

          <div className="bg-secondary mt-4 flex rounded-2xl p-1">
            {(["profile", "media", "badges", "account"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`press flex-1 rounded-xl py-2 text-sm font-bold capitalize ${
                  tab === value
                    ? "bg-gradient-brand text-primary-foreground shadow-glow"
                    : "text-muted-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <ProfileForm profile={profile} onSave={patchProfile} />
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="press bg-secondary text-secondary-foreground mt-4 block rounded-2xl px-4 py-3 text-center text-sm font-bold"
            >
               <ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden /> Admin console
            </Link>
          )}

          {tab === "media" && (
            <div className="mt-4">
              <MediaGallery userId={user.id} />
            </div>
          )}

          {tab === "badges" && (
            <section className="bg-card/85 shadow-card border-border/60 mt-4 grid grid-cols-3 gap-3 rounded-3xl border p-5 backdrop-blur-xl">
              {badges.map((badge) => (
                <div
                  key={badge.key}
                  className={`rounded-2xl p-3 text-center ${
                    badge.earned ? "bg-secondary" : "bg-muted/50 opacity-50"
                  }`}
                  title={badge.description}
                >
                   {(() => { const Icon = badgeIcons[badge.icon as keyof typeof badgeIcons] ?? Award; return <Icon className="text-primary mx-auto h-6 w-6" aria-hidden />; })()}
                  <p className="text-secondary-foreground mt-1 text-[11px] leading-tight font-bold">
                    {badge.name}
                  </p>
                </div>
              ))}
            </section>
          )}

          {tab === "account" && (
            <AccountPanel
              profile={profile}
              onPatch={patchProfile}
              onSignedOut={() => router.navigate({ to: "/auth" })}
              queryClient={queryClient}
            />
          )}
        </>
      )}

      <AppFooter />
      <AppNav />
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-secondary rounded-2xl py-2">
      <p className="text-secondary-foreground text-lg font-black">{value}</p>
      <p className="text-muted-foreground text-[10px] font-semibold">{label}</p>
    </div>
  );
}

type ProfileRow = {
  full_name: string;
  username: string;
  occupation: string | null;
  bio: string | null;
  phone: string | null;
  points: number;
  avatar_url: string | null;
};

function ProfileForm({
  profile,
  onSave,
}: {
  profile: ProfileRow & Record<string, unknown>;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    username: profile.username ?? "",
    occupation: profile.occupation ?? "",
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    website_url: (profile["website_url"] as string) ?? "",
    github_url: (profile["github_url"] as string) ?? "",
    linkedin_url: (profile["linkedin_url"] as string) ?? "",
    x_url: (profile["x_url"] as string) ?? "",
  });
  const [saving, setSaving] = useState(false);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  async function save() {
    if (form.full_name.trim().length < 2) return toast.error("Enter your full name");
    if (!/^[a-z0-9_]{3,20}$/i.test(form.username.trim()))
      return toast.error("Username: 3–20 letters, numbers or underscore");
    setSaving(true);
    try {
      await onSave({ ...form, username: form.username.trim().toLowerCase() });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 mt-4 space-y-3 rounded-3xl border p-5 backdrop-blur-xl">
      <Row label="Full name" id="full_name">
        <Input id="full_name" className="h-11 rounded-2xl" {...field("full_name")} />
      </Row>
      <Row label="Username" id="username">
        <Input id="username" className="h-11 rounded-2xl" {...field("username")} />
      </Row>
      <Row label="Occupation" id="occupation">
        <Input id="occupation" className="h-11 rounded-2xl" {...field("occupation")} />
      </Row>
      <Row label="Phone" id="phone">
        <Input id="phone" type="tel" className="h-11 rounded-2xl" {...field("phone")} />
      </Row>
      <Row label="Bio" id="bio">
        <Textarea id="bio" rows={3} maxLength={280} className="rounded-2xl" {...field("bio")} />
      </Row>
      <Row label="Website" id="website_url">
        <Input id="website_url" placeholder="https://" className="h-11 rounded-2xl" {...field("website_url")} />
      </Row>
      <Row label="GitHub" id="github_url">
        <Input id="github_url" placeholder="https://github.com/…" className="h-11 rounded-2xl" {...field("github_url")} />
      </Row>
      <Row label="LinkedIn" id="linkedin_url">
        <Input id="linkedin_url" placeholder="https://linkedin.com/in/…" className="h-11 rounded-2xl" {...field("linkedin_url")} />
      </Row>
      <Row label="X / Twitter" id="x_url">
        <Input id="x_url" placeholder="https://x.com/…" className="h-11 rounded-2xl" {...field("x_url")} />
      </Row>
      <Button className="press mt-1 h-11 w-full rounded-2xl" disabled={saving} onClick={() => void save()}>
        <Save className="mr-1 h-4 w-4" aria-hidden /> Save changes
      </Button>
    </section>
  );
}

function Row({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-bold uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

function AccountPanel({
  profile,
  onPatch,
  onSignedOut,
  queryClient,
}: {
  profile: Record<string, unknown>;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onSignedOut: () => void | Promise<unknown>;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const runExport = useServerFn(exportMyData);
  const runDeactivate = useServerFn(setDeactivated);
  const runDelete = useServerFn(deleteMyAccount);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const deactivated = Boolean(profile["deactivated"]);

  async function changePassword() {
    if (password.length < 8) return toast.error("Use at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return toast.error(error.message);
    setPassword("");
    setConfirmPassword("");
    toast.success("Password changed");
  }

  async function download() {
    setBusy("export");
    try {
      const data = await runExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sommyart-connect-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Your data is downloading");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function signOutEverywhere() {
    setBusy("signout");
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut({ scope: "global" });
    setBusy(null);
    await onSignedOut();
  }

  async function toggleDeactivate() {
    setBusy("deactivate");
    try {
      await runDeactivate({ data: { deactivated: !deactivated } });
      await onPatch({});
      toast.success(deactivated ? "Account reactivated" : "Account deactivated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update account");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    if (!deletePassword) return toast.error("Enter your password to confirm");
    if (!window.confirm("This permanently deletes your account and content. Continue?")) return;
    setBusy("delete");
    try {
      await runDelete({ data: { password: deletePassword } });
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      await onSignedOut();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="bg-card/85 shadow-card border-border/60 space-y-3 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground text-base font-extrabold">Notifications</h2>
        {[
          { key: "notify_announcements", label: "Community announcements" },
          { key: "notify_mentions", label: "Mentions, comments and reactions" },
          { key: "notify_digest", label: "Weekly digest email" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-card-foreground text-sm font-semibold">{label}</span>
            <Switch
              checked={profile[key] !== false}
              onCheckedChange={(next) => void onPatch({ [key]: next })}
            />
          </div>
        ))}
      </section>

      <section className="bg-card/85 shadow-card border-border/60 space-y-3 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground text-base font-extrabold">Change password</h2>
        <Input
          type="password"
          placeholder="New password"
          className="h-11 rounded-2xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          className="h-11 rounded-2xl"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button
          className="press h-11 w-full rounded-2xl"
          disabled={busy === "password"}
          onClick={() => void changePassword()}
        >
          Update password
        </Button>
      </section>

      <section className="bg-card/85 shadow-card border-border/60 space-y-3 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground text-base font-extrabold">Your data & sessions</h2>
        <Button
          variant="secondary"
          className="press h-11 w-full rounded-2xl"
          disabled={busy === "export"}
          onClick={() => void download()}
        >
          {busy === "export" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="mr-1 h-4 w-4" aria-hidden />
          )}
          Download my data
        </Button>
        <Button
          variant="secondary"
          className="press h-11 w-full rounded-2xl"
          disabled={busy === "signout"}
          onClick={() => void signOutEverywhere()}
        >
          <LogOut className="mr-1 h-4 w-4" aria-hidden /> Log out of all devices
        </Button>
      </section>

      <section className="border-destructive/40 bg-card/85 shadow-card space-y-3 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-destructive flex items-center gap-2 text-base font-extrabold">
          <ShieldAlert className="h-4 w-4" aria-hidden /> Danger zone
        </h2>
        <p className="text-muted-foreground text-xs">
          Deactivating hides your profile from the community — you can turn it back on any time.
          Deleting removes your account and content permanently.
        </p>
        <Button
          variant="secondary"
          className="press h-11 w-full rounded-2xl"
          disabled={busy === "deactivate"}
          onClick={() => void toggleDeactivate()}
        >
          {deactivated ? "Reactivate my account" : "Deactivate my account"}
        </Button>
        <Input
          type="password"
          placeholder="Password (to confirm deletion)"
          className="h-11 rounded-2xl"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
        <Button
          variant="destructive"
          className="press h-11 w-full rounded-2xl"
          disabled={busy === "delete"}
          onClick={() => void deleteAccount()}
        >
          <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Delete my account
        </Button>
      </section>
    </div>
  );
}
