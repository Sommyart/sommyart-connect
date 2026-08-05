import { useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { QUIZ_BANK, shuffle } from "@/lib/games";

/** Ten random questions with instant scoring. */
export function QuizGame() {
  const record = useRecordScore();
  const [questions, setQuestions] = useState(() => shuffle(QUIZ_BANK).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const question = questions[index]!;

  function choose(option: number) {
    if (picked !== null) return;
    setPicked(option);
    const correct = option === question.answer;
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      if (index === questions.length - 1) {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        if (final >= 7) void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        record.mutate(
          { game: "quiz", score: final },
          {
            onSuccess: (res) =>
              toast.success(res.points ? `+${res.points} points earned!` : `Scored ${final}/10`),
            onError: (e) => toast.error(e.message),
          },
        );
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 700);
  }

  function restart() {
    setQuestions(shuffle(QUIZ_BANK).slice(0, 10));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-5xl font-black text-primary">{score}/10</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {score >= 7 ? "Great work — points awarded (once a day)." : "Score 7+ to earn points."}
        </p>
        <Button className="press mt-4 rounded-2xl" onClick={restart}>
          Play again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-muted-foreground flex items-center justify-between text-xs font-bold">
        <span>
          Question {index + 1}/10 • {question.category}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-gradient-brand h-full" style={{ width: `${(index / 10) * 100}%` }} />
      </div>

      <p className="text-card-foreground mt-4 text-base font-bold">{question.q}</p>
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
