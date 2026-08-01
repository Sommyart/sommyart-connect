import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock, LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { AppFooter } from "@/components/AppFooter";
import { BottomNav } from "@/components/BottomNav";
import { ProfilePictureEditor } from "@/components/ProfilePictureEditor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WelcomeCard } from "@/components/WelcomeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogout, useMember } from "@/hooks/use-member";
import { updateProfile } from "@/lib/profile.functions";
import { birthdayLabel } from "@/lib/members";
import { getToken } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Profile — AWKA CONNECT" },
      {
        name: "description",
        content: "Manage your AWKA CONNECT profile picture, nickname, occupation and PIN hint.",
      },
      { property: "og:title", content: "Your Profile — AWKA CONNECT" },
      { property: "og:description", content: "Manage your AWKA CONNECT member profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: member, isLoading } = useMember();
  const logout = useLogout();
  const save = useServerFn(updateProfile);

  const [form, setForm] = useState({ nickname: "", occupation: "", password_hint: "" });
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !member) navigate({ to: "/login", replace: true });
  }, [isLoading, member, navigate]);

  useEffect(() => {
    if (member && loadedFor !== member.id) {
      setForm({
        nickname: member.nickname,
        occupation: member.occupation,
        password_hint: "",
      });
      setLoadedFor(member.id);
    }
  }, [member, loadedFor]);

  async function submit() {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await save({ data: { token, ...form } });
      await queryClient.invalidateQueries();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !member) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-primary h-7 w-7 animate-spin" aria-hidden />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-extrabold">Your profile</h1>
        <ThemeToggle />
      </div>

      <div className="mt-6 space-y-4">
        <WelcomeCard member={member} />

        <ProfilePictureEditor member={member} />

        <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
          <h2 className="text-card-foreground font-bold">Profile settings</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-nick">Nickname</Label>
              <Input
                id="p-nick"
                className="h-11 rounded-2xl"
                maxLength={40}
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-occ">Occupation</Label>
              <Input
                id="p-occ"
                className="h-11 rounded-2xl"
                maxLength={100}
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-hint">Password hint</Label>
              <Input
                id="p-hint"
                className="h-11 rounded-2xl"
                maxLength={120}
                placeholder="A clue that reminds you of your 4-digit PIN"
                value={form.password_hint}
                onChange={(e) => setForm({ ...form, password_hint: e.target.value })}
              />
            </div>
            <Button
              className="press h-12 w-full rounded-2xl"
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="mr-2 h-4 w-4" aria-hidden />
              )}
              Save changes
            </Button>
          </div>
        </section>

        <Link
          to="/whatsapp"
          className={`press flex items-center gap-3 rounded-3xl p-4 ${
            consent?.accepted
              ? "bg-gradient-brand text-primary-foreground shadow-glow"
              : "bg-card/85 border-border/60 border"
          }`}
        >
          <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">
              {consent?.accepted ? "🟢 WhatsApp Community Member" : "🔴 Not Yet Joined Community"}
            </p>
            <p className="text-xs opacity-90">
              {consent?.accepted
                ? "You accepted the community rules."
                : "Tap to read and accept the community rules."}
            </p>
          </div>
        </Link>

        {gameProfile && (
          <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
            <h2 className="text-card-foreground flex items-center gap-2 font-bold">
              <Award className="text-primary h-5 w-5" aria-hidden /> AWKA Points & badges
            </h2>
            <p className="text-primary mt-2 text-3xl font-black">{gameProfile.total_points}</p>
            <p className="text-muted-foreground text-xs font-semibold">
              {gameProfile.tier.emoji} {gameProfile.tier.badge}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {gameProfile.badges.length ? (
                gameProfile.badges.map((b) => (
                  <span
                    key={b}
                    className="bg-secondary text-secondary-foreground rounded-lg px-2 py-1 text-[10px] font-bold"
                  >
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">
                  Play in the Games & Fun Zone to earn your first badge.
                </span>
              )}
            </div>
          </section>
        )}

        <section className="bg-secondary rounded-3xl p-5">
          <h2 className="text-secondary-foreground flex items-center gap-2 text-sm font-bold">
            <Lock className="h-4 w-4" aria-hidden /> Locked after registration
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-muted-foreground">
              Real name: <span className="text-secondary-foreground font-semibold">{member.real_name}</span>
            </p>
            <p className="text-muted-foreground">
              Birthday:{" "}
              <span className="text-secondary-foreground font-semibold">
                {birthdayLabel(member.birth_day, member.birth_month)}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">
              Contact an admin if any of these details need to change.
            </p>
          </div>
        </section>


        <Button
          variant="secondary"
          className="press h-12 w-full rounded-2xl"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut className="mr-1 h-4 w-4" aria-hidden /> Log out
        </Button>
      </div>

      <AppFooter />
      <BottomNav />
    </main>
  );
}
