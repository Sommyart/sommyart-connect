import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import confetti from "canvas-confetti";
import { ArrowLeft, Camera, ImageIcon, Loader2, User } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerMember } from "@/lib/auth.functions";
import { cropSquareAndCompress } from "@/lib/image";
import { DAYS, MONTHS, uploadProfilePicture } from "@/lib/members";
import { setToken } from "@/lib/session";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — AWKA CONNECT Membership" },
      {
        name: "description",
        content: "Create your AWKA CONNECT account with a nickname and 4-digit PIN.",
      },
      { property: "og:title", content: "Register — AWKA CONNECT" },
      { property: "og:description", content: "Create your AWKA CONNECT member account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});

const schema = z.object({
  real_name: z.string().trim().min(2, "Please enter your real name").max(100),
  nickname: z
    .string()
    .trim()
    .min(2, "Please enter a nickname")
    .max(40)
    .regex(/^[\w .'-]+$/, "Letters, numbers, spaces and - _ . ' only"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  password_hint: z.string().trim().min(2, "Add a hint to help you remember").max(120),
  birth_day: z.string().min(1, "Select your day of birth"),
  birth_month: z.string().min(1, "Select your month of birth"),
  occupation: z.string().trim().min(2, "Please enter your occupation").max(100),
});

type FormValues = z.infer<typeof schema>;

function celebrate() {
  const colors = ["#F57C00", "#FFB74D", "#3B1F12", "#FFFFFF"];
  confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 }, colors });
  setTimeout(
    () => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors }),
    200,
  );
  setTimeout(
    () => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors }),
    350,
  );
}

function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const register = useServerFn(registerMember);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      real_name: "",
      nickname: "",
      pin: "",
      password_hint: "",
      birth_day: "",
      birth_month: "",
      occupation: "",
    },
  });

  async function handleFile(file?: File | null) {
    if (!file) return;
    try {
      const compressed = await cropSquareAndCompress(file);
      setBlob(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      toast.error("Could not read that image. Please try another one.");
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      let picturePath: string | null = null;
      if (blob) picturePath = await uploadProfilePicture(blob);

      const res = await register({
        data: {
          real_name: values.real_name,
          nickname: values.nickname,
          pin: values.pin,
          password_hint: values.password_hint,
          birth_day: Number(values.birth_day),
          birth_month: Number(values.birth_month),
          occupation: values.occupation,
          profile_picture: picturePath,
        },
      });

      setToken(res.token);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setDone(true);
      celebrate();
      setTimeout(() => navigate({ to: "/home" }), 2200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message.includes("nickname") ? message : "Registration failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-up">
          <Logo size={140} className="animate-float mx-auto h-32 w-32" />
          <h1 className="text-foreground mt-6 text-2xl font-extrabold">Welcome to AWKA CONNECT!</h1>
          <p className="text-muted-foreground mt-2 text-sm">Signing you in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-12">
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
          <h1 className="text-foreground text-lg leading-tight font-bold">Create your account</h1>
          <p className="text-muted-foreground text-xs">It only takes a minute</p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="bg-card/85 shadow-card animate-fade-up border-border/60 mt-6 space-y-5 rounded-3xl border p-6 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center">
          <div className="bg-gradient-brand shadow-glow h-24 w-24 overflow-hidden rounded-full p-1">
            {preview ? (
              <img
                src={preview}
                alt="Profile preview"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="bg-secondary text-muted-foreground flex h-full w-full items-center justify-center rounded-full">
                <User className="h-9 w-9" aria-hidden />
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="press rounded-2xl"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="mr-1 h-4 w-4" aria-hidden /> Camera
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="press rounded-2xl"
              onClick={() => galleryRef.current?.click()}
            >
              <ImageIcon className="mr-1 h-4 w-4" aria-hidden /> Gallery
            </Button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <p className="text-muted-foreground mt-2 text-xs">
            Square crop + compressed automatically
          </p>
        </div>

        <Field label="Real name" error={form.formState.errors.real_name?.message}>
          <Input id="real_name" className="h-12 rounded-2xl" {...form.register("real_name")} />
        </Field>

        <Field
          label="Nickname (must be unique)"
          error={form.formState.errors.nickname?.message}
        >
          <Input id="nickname" className="h-12 rounded-2xl" {...form.register("nickname")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="4-digit PIN" error={form.formState.errors.pin?.message}>
            <Input
              id="pin"
              inputMode="numeric"
              maxLength={4}
              autoComplete="new-password"
              className="h-12 rounded-2xl tracking-[0.4em]"
              {...form.register("pin")}
            />
          </Field>
          <Field label="Password hint" error={form.formState.errors.password_hint?.message}>
            <Input
              id="password_hint"
              className="h-12 rounded-2xl"
              placeholder="e.g. my lucky year"
              {...form.register("password_hint")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Day of birth</Label>
            <Select onValueChange={(v) => form.setValue("birth_day", v, { shouldValidate: true })}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.birth_day?.message} />
          </div>
          <div className="space-y-1.5">
            <Label>Month of birth</Label>
            <Select onValueChange={(v) => form.setValue("birth_month", v, { shouldValidate: true })}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.birth_month?.message} />
          </div>
        </div>

        <Field label="Occupation" error={form.formState.errors.occupation?.message}>
          <Input id="occupation" className="h-12 rounded-2xl" {...form.register("occupation")} />
        </Field>

        <Button
          type="submit"
          disabled={submitting}
          className="press shadow-glow h-13 w-full rounded-2xl text-base"
        >
          {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> : null}
          {submitting ? "Creating account…" : "Complete registration"}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Already a member?{" "}
          <Link to="/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs font-medium">{message}</p>;
}
