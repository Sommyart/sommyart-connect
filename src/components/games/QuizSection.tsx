import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Clock, Share2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { shuffle, useAwardPoints, useQuizQuestions, type QuizQuestion } from "@/hooks/use-games";

const DIFFICULTIES = ["any", "easy", "medium", "hard"] as const;

export function QuizSection() {
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("any");
  const [timed, setTimed] = useState(true);
  const { data: pool = [], isLoading } = useQuizQuestions(difficulty);
  const [round, setRound] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(20);
  const award = useAwardPoints();

  const finished = round.length > 0 && index >= round.length;
  const score = useMemo(
    () => answers.filter((a, i) => a === round[i]?.answer_index).length,
    [answers, round],
  );

  function start() {
    setRound(shuffle(pool).slice(0, 10));
    setIndex(0);
    setAnswers([]);
    setSeconds(20);
  }

  function answer(choice: number) {
    setAnswers((prev) => [...prev, choice]);
    setIndex((i) => i + 1);
    setSeconds(20);
  }

  useEffect(() => {
    if (!timed || finished || round.length === 0) return;
    if (seconds <= 0) {
      answer(-1);
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, timed, finished, round.length, index]);

  useEffect(() => {
    if (!finished) return;
    const pct = Math.round((score / round.length) * 100);
    if (pct >= 60) void confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
    award.mutate({ reason: "quiz", score: pct });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  async function share() {
    const pct = Math.round((score / round.length) * 100);
    const text = `I scored ${score}/${round.length} (${pct}%) on the AWKA CONNECT Quiz Challenge! 🧡`;
    try {
      if (navigator.share) await navigator.share({ text, title: "AWKA CONNECT Quiz" });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Score copied — paste it in the group!");
      }
    } catch {
      /* dismissed */
    }
  }

  const current = round[index];

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
        <Sparkles className="text-primary h-5 w-5" aria-hidden /> Quiz Challenge
      </h2>

      {round.length === 0 && (
        <>
          <p className="text-muted-foreground mt-1 text-sm">
            10 random questions from Nigeria, Awka, Bible, science, movies, sports and more. Earn
            +10 AWKA Points every round.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={difficulty === d ? "default" : "secondary"}
                className="press rounded-xl capitalize"
                onClick={() => setDifficulty(d)}
              >
                {d}
              </Button>
            ))}
            <Button
              size="sm"
              variant={timed ? "default" : "secondary"}
              className="press rounded-xl"
              onClick={() => setTimed((t) => !t)}
            >
              <Clock className="mr-1 h-4 w-4" aria-hidden /> Timer {timed ? "on" : "off"}
            </Button>
          </div>
          <Button
            className="press mt-4 h-12 w-full rounded-2xl"
            disabled={isLoading || pool.length === 0}
            onClick={start}
          >
            {isLoading ? "Loading questions…" : "Start quiz"}
          </Button>
        </>
      )}

      {current && (
        <div className="animate-fade-up mt-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-primary">
              Question {index + 1} of {round.length}
            </span>
            <span className="text-muted-foreground">{current.category}</span>
          </div>
          <div className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-gradient-brand h-full transition-all"
              style={{ width: `${(index / round.length) * 100}%` }}
            />
          </div>
          {timed && (
            <p className="text-muted-foreground mt-2 text-right text-xs font-semibold">
              ⏱ {seconds}s
            </p>
          )}
          <p className="text-card-foreground mt-3 font-bold">{current.question}</p>
          <div className="mt-3 space-y-2">
            {current.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => answer(i)}
                className="press bg-secondary text-secondary-foreground hover:bg-primary/10 w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="animate-fade-up mt-4">
          <div className="bg-gradient-brand text-primary-foreground shadow-glow rounded-3xl p-5 text-center">
            <p className="text-4xl font-black">{Math.round((score / round.length) * 100)}%</p>
            <p className="text-sm font-semibold opacity-90">
              {score} of {round.length} correct • +10 AWKA Points
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {round.map((q, i) => {
              const ok = answers[i] === q.answer_index;
              return (
                <div key={q.id} className="bg-secondary rounded-2xl px-4 py-3">
                  <p className="text-secondary-foreground flex items-start gap-2 text-sm font-semibold">
                    {ok ? (
                      <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    )}
                    {q.question}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Correct answer: {q.options[q.answer_index]}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="press h-11 flex-1 rounded-2xl" onClick={start}>
              Play again
            </Button>
            <Button
              variant="secondary"
              className="press h-11 rounded-2xl"
              onClick={() => void share()}
            >
              <Share2 className="mr-1 h-4 w-4" aria-hidden /> Share
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
