import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppFooter } from "@/components/AppFooter";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMember } from "@/hooks/use-member";
import { useRecordConsent, useRecordJoinClick, useWhatsappConsent } from "@/hooks/use-whatsapp";
import { WHATSAPP_LINK } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/whatsapp")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join the WhatsApp Community | AWKA CONNECT" },
      {
        name: "description",
        content:
          "Read and accept the AWKA CONNECT community rules, then join the official WhatsApp group.",
      },
      { property: "og:title", content: "Join the WhatsApp Community | AWKA CONNECT" },
      {
        property: "og:description",
        content: "Accept the AWKA CONNECT rules and join our WhatsApp community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhatsAppPage,
});

const RULES = [
  {
    title: "1. Respect Everyone",
    body: "Treat every member with dignity regardless of age, gender, tribe, religion or opinions. No bullying, harassment or personal attacks.",
  },
  {
    title: "2. No Hate Speech",
    body: "Racist, tribal, discriminatory or offensive comments are not allowed.",
  },
  {
    title: "3. Keep Conversations Civil",
    body: "Healthy debates are encouraged. Arguments, insults and unnecessary drama are not.",
  },
  {
    title: "4. No Spam",
    body: "Avoid flooding the group with advertisements, chain messages, fake news or repeated messages unless approved by admins.",
  },
  {
    title: "5. Protect Privacy",
    body: "Do not share another member's phone number, pictures or personal information without permission.",
  },
  {
    title: "6. Participate Positively",
    body: "Join activities, support fellow members and encourage meaningful conversations.",
  },
  {
    title: "7. Follow Admin Instructions",
    body: "Admins maintain order. Please cooperate whenever guidance is given.",
  },
  {
    title: "8. Zero Tolerance for Illegal Content",
    body: "Sharing illegal, violent or harmful content will result in immediate removal.",
  },
  {
    title: "9. Have Fun Responsibly",
    body: "AWKA CONNECT is a place to Connect, Engage and Grow. Let's keep it enjoyable for everyone.",
  },
];

function WhatsAppPage() {
  const { data: member } = useMember();
  const { data: consent, isLoading } = useWhatsappConsent();
  const record = useRecordConsent();
  const clickJoin = useRecordJoinClick();
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);

  const accepted = consent?.accepted === true;

  function agree() {
    record.mutate(true, {
      onSuccess: () => {
        setDeclined(false);
        void confetti({ particleCount: 130, spread: 80, origin: { y: 0.7 } });
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Please log in first"),
    });
  }

  function disagree() {
    setDeclined(true);
    record.mutate(false, {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Please log in first"),
    });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <header className="flex items-center gap-3">
        <Link to="/home" className="press text-muted-foreground p-1" aria-label="Back home">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Logo size={44} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-lg font-extrabold">Community Rules</h1>
          <p className="text-muted-foreground text-xs">Connect • Engage • Grow</p>
        </div>
      </header>

      {!member && (
        <p className="border-primary/30 bg-primary/5 text-muted-foreground mt-5 rounded-2xl border border-dashed p-4 text-sm">
          Please <Link to="/login" className="text-primary font-semibold">log in</Link> so we can
          record your acceptance.
        </p>
      )}

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden />
        </div>
      ) : accepted ? (
        <section className="animate-fade-up mt-5 space-y-4">
          <div className="bg-gradient-brand text-primary-foreground shadow-glow rounded-3xl p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10" aria-hidden />
            <p className="mt-2 text-xl font-black">🎉 Welcome to AWKA CONNECT!</p>
            <p className="mt-1 text-sm opacity-90">
              You have successfully accepted the community guidelines.
            </p>
            <div className="mt-3 flex justify-center gap-3 text-xs font-semibold">
              <span>🧡 Connect</span>
              <span>💬 Engage</span>
              <span>📈 Grow</span>
            </div>
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => clickJoin.mutate()}
            className="press bg-gradient-brand text-primary-foreground shadow-glow flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-extrabold"
          >
            <MessageCircle className="h-5 w-5" aria-hidden /> 🚀 Join AWKA CONNECT WhatsApp
          </a>

          <p className="text-muted-foreground text-center text-xs">
            The group opens in a new tab. Your profile now shows 🟢 WhatsApp Community Member.
          </p>
        </section>
      ) : (
        <>
          <section className="bg-card/85 shadow-card border-border/60 animate-fade-up mt-5 rounded-3xl border p-5 backdrop-blur-xl">
            <p className="text-card-foreground text-sm font-bold">Welcome!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              We're excited to have you here. Our goal is to build a respectful, fun, engaging and
              supportive community for everyone. Before joining, please agree to the following:
            </p>

            <div className="mt-4 space-y-3">
              {RULES.map((rule) => (
                <div key={rule.title} className="bg-secondary rounded-2xl p-4">
                  <p className="text-primary text-sm font-extrabold">{rule.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{rule.body}</p>
                </div>
              ))}
            </div>
          </section>

          <label className="bg-card/85 border-border/60 mt-4 flex items-start gap-3 rounded-2xl border p-4">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5"
            />
            <span className="text-card-foreground text-xs font-semibold leading-relaxed">
              I have read and agree to follow the AWKA CONNECT Community Rules and Regulations.
            </span>
          </label>

          <div className="mt-4 flex gap-2">
            <Button
              className="press h-12 flex-1 rounded-2xl"
              disabled={!checked || record.isPending}
              onClick={agree}
            >
              {record.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              ✅ I Agree
            </Button>
            <Button
              variant="secondary"
              className="press h-12 flex-1 rounded-2xl"
              onClick={disagree}
            >
              ❌ I Do Not Agree
            </Button>
          </div>

          {declined && (
            <p className="border-destructive/40 bg-destructive/5 text-destructive animate-fade-up mt-4 flex items-start gap-2 rounded-2xl border p-4 text-xs font-semibold">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              You must agree to the AWKA CONNECT Community Rules before joining the WhatsApp group.
            </p>
          )}
        </>
      )}

      <AppFooter />
      <BottomNav />
    </main>
  );
}
