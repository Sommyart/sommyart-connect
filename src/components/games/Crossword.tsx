import { useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { CROSSWORD } from "@/lib/games";

/** Small 5x5 mini crossword with cell-by-cell input. */
export function Crossword() {
  const record = useRecordScore();
  const { size, grid, clues } = CROSSWORD;
  const [cells, setCells] = useState<string[][]>(() => grid.map((row) => row.split("").map((c) => (c === "#" ? "#" : ""))));
  const [done, setDone] = useState(false);

  function setCell(r: number, c: number, value: string) {
    if (done) return;
    const letter = value.slice(-1).toUpperCase();
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r]![c] = letter;
      return next;
    });
  }

  function check() {
    let correct = 0;
    for (const clue of clues) {
      let word = "";
      for (let i = 0; i < clue.len; i += 1) {
        const r = clue.dir === "down" ? clue.row + i : clue.row;
        const c = clue.dir === "across" ? clue.col + i : clue.col;
        word += cells[r]?.[c] ?? "";
      }
      if (word === clue.answer) correct += 1;
    }
    const score = Math.round((correct / clues.length) * 100);
    setDone(true);
    if (correct === clues.length) void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    record.mutate(
      { game: "crossword", score },
      { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `${correct}/${clues.length} correct`) },
    );
  }

  function restart() {
    setCells(grid.map((row) => row.split("").map((c) => (c === "#" ? "#" : ""))));
    setDone(false);
  }

  return (
    <div>
      <div className="mx-auto grid max-w-[260px] gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {grid.map((row, r) =>
          row.split("").map((cell, c) =>
            cell === "#" ? (
              <div key={`${r}-${c}`} className="bg-muted aspect-square rounded-md" />
            ) : (
              <input
                key={`${r}-${c}`}
                maxLength={1}
                value={cells[r]?.[c] ?? ""}
                disabled={done}
                onChange={(e) => setCell(r, c, e.target.value)}
                className="border-border/60 bg-card text-card-foreground aspect-square rounded-md border text-center text-sm font-bold uppercase"
              />
            ),
          ),
        )}
      </div>

      <ul className="mt-4 space-y-1">
        {clues.map((clue) => (
          <li key={clue.number} className="text-muted-foreground text-xs">
            <span className="text-foreground font-bold">
              {clue.number}. {clue.dir}
            </span>{" "}
            — {clue.clue}
          </li>
        ))}
      </ul>

      {!done ? (
        <Button className="press mt-4 w-full rounded-2xl" onClick={check}>
          Check answers
        </Button>
      ) : (
        <Button className="press mt-4 w-full rounded-2xl" onClick={restart}>
          Play again
        </Button>
      )}
    </div>
  );
}
