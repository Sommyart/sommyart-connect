import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { CODE_QUESTIONS, shuffle } from "@/lib/games";

/** Multiple-choice "what does this snippet output" quiz. */
export function CodeChallenge() {
  const record = useRecordScore();
  const [questions, setQuestions] = useState(() => shuffle(CODE_QUESTIONS));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const question = questions[index]!;
  const total = questions.length;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === question.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index === total - 1) {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        record.mutate(
          { game: "code", score: final },
          { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `Scored ${final}/${total}`) },
        );
      } else {
        setIndex((v) => v + 1);
        setPicked(null);
      }
    }, 700);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-primary text-5xl font-black">
          {score}/{total}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">Score 7+ to earn points.</p>
        <Button
          className="press mt-4 rounded-2xl"
          onClick={() => {
            setQuestions(shuffle(CODE_QUESTIONS));
            setIndex(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
        >
          Play again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground text-xs font-bold">
        Snippet {index + 1}/{total} • Score {score}
      </p>
      <pre className="bg-secondary text-secondary-foreground mt-3 overflow-x-auto rounded-2xl p-3 text-sm font-mono">
        {question.code}
      </pre>
      <div className="mt-3 grid grid-cols-2 gap-2">
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
              className={`press rounded-2xl px-3 py-3 font-mono text-xs font-semibold ${state}`}
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
