import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — SOMMYART CONNECT" },
      {
        name: "description",
        content: "Choose a new password for your SOMMYART CONNECT account.",
      },
      { property: "og:title", content: "Reset password — SOMMYART CONNECT" },
      { property: "og:description", content: "Set a new password and get back to building." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    void navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 sm:max-w-lg">
      <div className="flex flex-col items-center text-center">
        <Logo size={88} className="h-22 w-22" />
        <h1 className="text-foreground mt-3 text-2xl font-black">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Open this page from the recovery email link, then choose a new password.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-card/85 shadow-card border-border/60 mt-6 space-y-3 rounded-3xl border p-5 backdrop-blur-xl"
      >
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            className="h-11 rounded-2xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            className="h-11 rounded-2xl"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy} className="press h-12 w-full rounded-2xl font-bold">
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </main>
  );
}
