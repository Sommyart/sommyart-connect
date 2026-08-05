import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { shuffle, TOOL_CLUES } from "@/lib/games";

/** Guess the AI tool from a one-line clue. */
export function ToolGuess() {
  const record = useRecordScore();
  const [rounds, setRounds] = useState(() => shuffle(TOOL_CLUES).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[index]!;
  const options = round.options;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === round.answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index === rounds.length - 1) {
        const final = score + (correct ? 1 : 0);
        setDone(true);
        record.mutate(
          { game: "toolguess", score: final, won: final >= 4 },
          { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `Scored ${final}/5`) },
        );
      } else {
        setIndex((v) => v + 1);
        setPicked(null);
      }
    }, 600);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-primary text-5xl font-black">{score}/5</p>
        <p className="text-muted-foreground mt-1 text-sm">Get 4+ right to earn points.</p>
        <Button
          className="press mt-4 rounded-2xl"
          onClick={() => {
            setRounds(shuffle(TOOL_CLUES).slice(0, 5));
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
        Clue {index + 1}/5 • Score {score}
      </p>
      <p className="text-card-foreground mt-3 text-base font-bold">{round.clue}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option, i) => {
          const state =
            picked === null
              ? "bg-secondary text-secondary-foreground"
              : i === round.answer
                ? "bg-primary text-primary-foreground"
                : i === picked
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary text-secondary-foreground opacity-60";
          return (
            <button
              key={option}
              className={`press rounded-2xl px-3 py-3 text-sm font-semibold ${state}`}
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
