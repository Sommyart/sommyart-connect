import { useMemo } from "react";
import { CalendarCheck, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDailyChallenge, useGameProfile, useQuizQuestions, useRiddles } from "@/hooks/use-games";

export function DailyChallenge() {
  const { data: profile } = useGameProfile();
  const { data: questions = [] } = useQuizQuestions("any");
  const { data: riddles = [] } = useRiddles("any");
  const complete = useDailyChallenge();

  const day = Math.floor(Date.now() / 86_400_000);
  const kind = ["Quiz of the Day", "Riddle of the Day", "Puzzle of the Day"][day % 3]!;

  const prompt = useMemo(() => {
    if (kind === "Riddle of the Day" && riddles.length) return riddles[day % riddles.length]!.question;
    if (kind === "Quiz of the Day" && questions.length)
      return questions[day % questions.length]!.question;
    return "Win a round of Tic Tac Toe against the AI on Hard difficulty.";
  }, [kind, riddles, questions, day]);

  const done = profile?.dailyDone;

  return (
    <section className="border-primary/30 bg-primary/5 rounded-3xl border border-dashed p-5">
      <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
        <CalendarCheck className="text-primary h-5 w-5" aria-hidden /> Daily challenge
      </h2>
      <p className="text-primary mt-1 text-[11px] font-bold tracking-widest uppercase">{kind}</p>
      <p className="text-card-foreground mt-2 text-sm font-semibold">{prompt}</p>

      <Button
        className="press mt-4 h-11 w-full rounded-2xl"
        disabled={done || complete.isPending}
        onClick={() =>
          complete.mutate(kind, {
            onSuccess: () => toast.success("Daily challenge complete! +15 AWKA Points"),
            onError: (e) => toast.error(e instanceof Error ? e.message : "Try again"),
          })
        }
      >
        {complete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Gift className="mr-1 h-4 w-4" aria-hidden />}
        {done ? "Completed today ✓" : "Claim +15 points"}
      </Button>
    </section>
  );
}
