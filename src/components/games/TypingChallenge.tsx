import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { shuffle, TYPING_QUOTES } from "@/lib/games";

const DURATION = 60;

/** 60-second typing test against a tech quote — reports WPM and accuracy. */
export function TypingChallenge() {
  const record = useRecordScore();
  const [quote] = useState(() => shuffle(TYPING_QUOTES)[0]!);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [done, setDone] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (!started || done) return;
    if (timeLeft <= 0) {
      setDone(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [started, timeLeft, done]);

  useEffect(() => {
    if (input.length >= quote.length && !done) setDone(true);
  }, [input, quote, done]);

  const correctChars = input.split("").filter((ch, i) => ch === quote[i]).length;
  const accuracy = input.length ? Math.round((correctChars / input.length) * 100) : 100;
  const elapsedMinutes = Math.max(1, DURATION - timeLeft) / 60;
  const wpm = Math.round(correctChars / 5 / elapsedMinutes);

  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    const scaled = Math.max(0, Math.min(100, Math.round(wpm * (accuracy / 100))));
    record.mutate(
      { game: "typing", score: scaled },
      { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `${wpm} WPM, ${accuracy}% accuracy`) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function restart() {
    window.location.reload();
  }

  return (
    <div>
      <div className="text-muted-foreground flex items-center justify-between text-xs font-bold">
        <span>Time left: {timeLeft}s</span>
        <span>WPM {wpm} • Accuracy {accuracy}%</span>
      </div>
      <p className="text-card-foreground bg-secondary mt-3 rounded-2xl p-3 text-sm leading-relaxed font-semibold">
        {quote.split("").map((ch, i) => (
          <span
            key={i}
            className={
              i >= input.length
                ? "text-muted-foreground"
                : input[i] === ch
                  ? "text-primary"
                  : "text-destructive underline"
            }
          >
            {ch}
          </span>
        ))}
      </p>
      <textarea
        className="border-border/60 bg-card mt-3 w-full rounded-2xl border p-3 text-sm"
        rows={3}
        placeholder="Start typing to begin the timer…"
        value={input}
        disabled={done}
        onChange={(e) => {
          if (!started) setStarted(true);
          setInput(e.target.value);
        }}
      />
      {done && (
        <div className="mt-3 text-center">
          <p className="text-primary text-4xl font-black">{wpm} WPM</p>
          <p className="text-muted-foreground text-xs">{accuracy}% accuracy</p>
          <Button className="press mt-4 rounded-2xl" onClick={restart}>
            Play again
          </Button>
        </div>
      )}
    </div>
  );
}
