import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { bestMove, winnerOf } from "@/lib/games";

type Mode = "ai" | "friend";

/** Tic-tac-toe against an unbeatable-ish AI or a friend on one device. */
export function TicTacToe() {
  const record = useRecordScore();
  const [mode, setMode] = useState<Mode>("ai");
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [tally, setTally] = useState({ win: 0, loss: 0, draw: 0 });

  const result = winnerOf(board);

  useEffect(() => {
    if (mode !== "ai" || result || turn !== "O") return;
    const timer = setTimeout(() => {
      const move = bestMove(board);
      setBoard((prev) => {
        const next = [...prev];
        if (!next[move]) next[move] = "O";
        return next;
      });
      setTurn("X");
    }, 350);
    return () => clearTimeout(timer);
  }, [board, mode, result, turn]);

  useEffect(() => {
    if (!result) return;
    if (result === "draw") setTally((t) => ({ ...t, draw: t.draw + 1 }));
    else if (result === "X") setTally((t) => ({ ...t, win: t.win + 1 }));
    else setTally((t) => ({ ...t, loss: t.loss + 1 }));

    if (mode === "ai") {
      const won = result === "X";
      if (won) void confetti({ particleCount: 80, spread: 65, origin: { y: 0.7 } });
      record.mutate(
        { game: "tictactoe", score: won ? 1 : 0, won },
        { onSuccess: (res) => res.points && toast.success(`+${res.points} points!`) },
      );
    }
    // Only react to a finished board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function play(index: number) {
    if (board[index] || result) return;
    if (mode === "ai" && turn !== "X") return;
    const next = [...board];
    next[index] = turn;
    setBoard(next);
    setTurn(turn === "X" ? "O" : "X");
  }

  function reset(nextMode: Mode = mode) {
    setMode(nextMode);
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  return (
    <div>
      <div className="flex gap-2">
        {(["ai", "friend"] as const).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={mode === m ? "default" : "secondary"}
            className="press rounded-xl"
            onClick={() => reset(m)}
          >
            {m === "ai" ? "vs AI" : "vs Friend"}
          </Button>
        ))}
        <Button size="sm" variant="secondary" className="press ml-auto rounded-xl" onClick={() => reset()}>
          Reset
        </Button>
      </div>

      <div className="mx-auto mt-4 grid max-w-[280px] grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            aria-label={`Cell ${i + 1}`}
            className="bg-secondary text-secondary-foreground press flex aspect-square items-center justify-center rounded-2xl text-3xl font-black"
            onClick={() => play(i)}
          >
            <span className={cell === "X" ? "text-primary" : ""}>{cell}</span>
          </button>
        ))}
      </div>

      <p className="text-muted-foreground mt-3 text-center text-sm font-bold">
        {result
          ? result === "draw"
            ? "It's a draw"
            : `${result} wins!`
          : `${turn}'s turn`}
      </p>
      <p className="text-muted-foreground mt-1 text-center text-xs">
        Wins {tally.win} • Losses {tally.loss} • Draws {tally.draw}
      </p>
    </div>
  );
}
