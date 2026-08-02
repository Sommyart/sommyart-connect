import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Join SOMMYART CONNECT, the AI and tech learning community where creators build, teach, collaborate and grow together.",
      },
      { property: "og:title", content: "Sign in — SOMMYART CONNECT" },
      {
        property: "og:description",
        content: "Create your SOMMYART CONNECT account and start building with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    username: "",
    phone: "",
    occupation: "",
    bio: "",
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: form.full_name.trim(),
              username: form.username.trim().toLowerCase(),
              phone: form.phone.trim(),
              occupation: form.occupation.trim(),
              bio: form.bio.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success("Welcome to SOMMYART CONNECT");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      }
      void navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <Logo size={104} className="h-26 w-26 animate-float" />
        <h1 className="text-foreground mt-3 text-2xl font-black tracking-tight">SOMMYART CONNECT</h1>
        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.24em] uppercase">
          Connect • Engage • Grow
        </p>
      </div>

      <div className="bg-card/85 shadow-card border-border/60 mt-6 rounded-3xl border p-5 backdrop-blur-xl">
        <div className="bg-secondary flex rounded-2xl p-1">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`press flex-1 rounded-xl py-2 text-sm font-bold ${
                mode === value
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground"
              }`}
            >
              {value === "signin" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <>
              <Field label="Full name" required value={form.full_name} onChange={set("full_name")} />
              <Field
                label="Username"
                required
                value={form.username}
                onChange={set("username")}
                placeholder="e.g. sommy_ai"
              />
              <Field label="Phone number" value={form.phone} onChange={set("phone")} type="tel" />
              <Field label="Occupation" value={form.occupation} onChange={set("occupation")} />
              <div className="space-y-1.5">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  maxLength={280}
                  value={form.bio}
                  onChange={set("bio")}
                  placeholder="What are you building with AI?"
                  className="rounded-2xl"
                />
              </div>
            </>
          )}
          <Field label="Email" required type="email" value={form.email} onChange={set("email")} />
          <Field
            label="Password"
            required
            type="password"
            value={form.password}
            onChange={set("password")}
          />

          <Button type="submit" disabled={busy} className="press h-12 w-full rounded-2xl text-base font-bold">
            {busy ? "Please wait…" : mode === "signin" ? "Log in" : "Create my account"}
          </Button>
        </form>
      </div>

      <p className="text-muted-foreground mt-5 text-center text-xs">
        An AI & tech learning ecosystem for African creators.
      </p>
    </main>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-11 rounded-2xl" {...props} />
    </div>
  );
}
