import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useRecordScore } from "@/hooks/use-games";

const COLORS = ["bg-primary", "bg-secondary", "bg-accent", "bg-destructive"] as const;

/** Simon-style rising-difficulty memory sequence game. */
export function LogicGame() {
  const record = useRecordScore();
  const [sequence, setSequence] = useState<number[]>([]);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "over">("idle");
  const recorded = useRef(false);

  function start() {
    recorded.current = false;
    setSequence([Math.floor(Math.random() * 4)]);
    setInputIndex(0);
    setPhase("showing");
  }

  useEffect(() => {
    if (phase !== "showing") return;
    setShowingIndex(-1);
    let i = 0;
    const timer = setInterval(() => {
      setShowingIndex(sequence[i] ?? -1);
      i += 1;
      if (i > sequence.length) {
        clearInterval(timer);
        setShowingIndex(-1);
        setPhase("input");
      }
    }, 550);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence.length]);

  function press(color: number) {
    if (phase !== "input") return;
    if (color !== sequence[inputIndex]) {
      setPhase("over");
      if (!recorded.current) {
        recorded.current = true;
        const score = Math.max(1, sequence.length - 1);
        record.mutate(
          { game: "logic", score },
          { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `Reached level ${score}`) },
        );
      }
      return;
    }
    if (inputIndex + 1 === sequence.length) {
      setSequence((s) => [...s, Math.floor(Math.random() * 4)]);
      setInputIndex(0);
      setPhase("showing");
    } else {
      setInputIndex((i) => i + 1);
    }
  }

  if (phase === "idle" || phase === "over") {
    return (
      <div className="text-center">
        {phase === "over" && (
          <p className="text-primary mb-3 text-4xl font-black">Level {Math.max(0, sequence.length - 1)}</p>
        )}
        <button className="press bg-primary text-primary-foreground rounded-2xl px-6 py-3 font-bold" onClick={start}>
          {phase === "over" ? "Play again" : "Start sequence"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground text-center text-xs font-bold">
        Level {sequence.length} • {phase === "showing" ? "Watch…" : "Your turn"}
      </p>
      <div className="mx-auto mt-4 grid max-w-[240px] grid-cols-2 gap-3">
        {COLORS.map((color, i) => (
          <button
            key={color}
            aria-label={`Tile ${i + 1}`}
            onClick={() => press(i)}
            className={`press aspect-square rounded-2xl ${color} transition-opacity ${
              showingIndex === i ? "opacity-100 ring-4 ring-white/70" : "opacity-70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
