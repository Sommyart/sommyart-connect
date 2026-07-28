import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, HelpCircle, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPinHint, loginMember, requestPinReset } from "@/lib/auth.functions";
import { setToken } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — AWKA CONNECT" },
      {
        name: "description",
        content: "Sign in to AWKA CONNECT with your nickname and 4-digit PIN.",
      },
      { property: "og:title", content: "Log in — AWKA CONNECT" },
      { property: "og:description", content: "Sign in with your nickname and 4-digit PIN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const schema = z.object({
  nickname: z.string().trim().min(2, "Enter your nickname").max(40),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

type FormValues = z.infer<typeof schema>;

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useServerFn(loginMember);
  const hintFn = useServerFn(getPinHint);
  const resetFn = useServerFn(requestPinReset);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: "", pin: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await login({ data: values });
      setToken(res.token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`Welcome back, ${res.member.nickname}!`);
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign you in");
      setSubmitting(false);
    }
  }

  async function showHint() {
    const nickname = form.getValues("nickname").trim();
    if (nickname.length < 2) return toast.error("Enter your nickname first");
    const res = await hintFn({ data: { nickname } });
    if (!res.hint) return toast.error("No hint found for that nickname");
    setHint(res.hint);
  }

  async function askReset() {
    const nickname = form.getValues("nickname").trim();
    if (nickname.length < 2) return toast.error("Enter your nickname first");
    await resetFn({ data: { nickname } });
    toast.success("PIN reset requested — an admin will help you shortly.");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back"
          className="bg-card shadow-soft press text-foreground flex h-10 w-10 items-center justify-center rounded-full"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Logo size={40} className="h-10 w-10" />
        <div>
          <h1 className="text-foreground text-lg leading-tight font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-xs">Sign in to continue</p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card/85 shadow-card animate-fade-up border-border/60 mt-8 space-y-5 rounded-3xl border p-6 backdrop-blur-xl"
      >
        <div className="space-y-1.5">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" className="h-12 rounded-2xl" {...form.register("nickname")} />
          {form.formState.errors.nickname && (
            <p className="text-destructive text-xs font-medium">
              {form.formState.errors.nickname.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pin">4-digit PIN</Label>
          <Input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="h-12 rounded-2xl tracking-[0.5em]"
            {...form.register("pin")}
          />
          {form.formState.errors.pin && (
            <p className="text-destructive text-xs font-medium">
              {form.formState.errors.pin.message}
            </p>
          )}
        </div>

        {hint && (
          <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3 text-sm">
            <span className="font-semibold">Your hint:</span> {hint}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="press shadow-glow h-13 w-full rounded-2xl text-base"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <LogIn className="mr-2 h-5 w-5" aria-hidden />
          )}
          {submitting ? "Signing in…" : "Log in"}
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => void showHint()}
            className="text-primary inline-flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden /> Show my hint
          </button>
          <button
            type="button"
            onClick={() => void askReset()}
            className="text-muted-foreground font-semibold"
          >
            Forgot PIN?
          </button>
        </div>

        <p className="text-muted-foreground text-center text-sm">
          New here?{" "}
          <Link to="/register" className="text-primary font-semibold">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
