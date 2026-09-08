import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useRecordScore } from "@/hooks/use-games";
import { useQuizBank } from "@/hooks/use-quiz-bank";

const PER_QUESTION_SECONDS = 8;

/** Rapid 10-question trivia round with a per-question countdown timer. */
export function Trivia() {
  const record = useRecordScore();
  const { data: questions = [], isFetching } = useQuizBank({ category: "All", difficulty: "Any", count: 10, mode: "timed" });
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PER_QUESTION_SECONDS);

  const total = questions.length;
  const question = questions[index];

  useEffect(() => {
    if (done || !question) return;
    if (timeLeft <= 0) {
      advance(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, done, index]);

  function advance(correct: boolean) {
    const nextScore = score + (correct ? 1 : 0);
    if (index === total - 1) {
      setScore(nextScore);
      setDone(true);
      record.mutate(
        { game: "trivia", score: nextScore },
        { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `Scored ${nextScore}/${total}`) },
      );
    } else {
      setScore(nextScore);
      setIndex((i) => i + 1);
      setPicked(null);
      setTimeLeft(PER_QUESTION_SECONDS);
    }
  }

  function choose(i: number) {
    if (picked !== null || !question) return;
    setPicked(i);
    setTimeout(() => advance(i === question.answer), 400);
  }

  if (isFetching || !question) return <div className="bg-muted h-40 animate-pulse rounded-2xl" />;

  if (done) {
    return (
      <div className="text-center">
        <p className="text-primary text-5xl font-black">
          {score}/{total}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">Score 7+ to earn points.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-muted-foreground flex items-center justify-between text-xs font-bold">
        <span>
          Q{index + 1}/{total} • {question.category}
        </span>
        <span className={timeLeft <= 3 ? "text-destructive" : ""}>{timeLeft}s</span>
      </div>
      <div className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-gradient-brand h-full transition-all"
          style={{ width: `${(timeLeft / PER_QUESTION_SECONDS) * 100}%` }}
        />
      </div>
      <p className="text-card-foreground mt-3 text-base font-bold">{question.q}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((option, i) => {
          const state =
            picked === null
              ? "bg-secondary text-secondary-foreground"
              : i === question.answer
                ? "bg-primary text-primary-foreground"
                : i === picked
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary text-secondary-foreground opacity-60";
          return (
            <button
              key={option}
              className={`press w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${state}`}
              onClick={() => choose(i)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
