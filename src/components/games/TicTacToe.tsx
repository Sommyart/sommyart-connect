import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { bestMove, winningLine } from "@/lib/games";

type Mode = "ai" | "friend";

const EMPTY = Array<string | null>(9).fill(null);

/** Centre of a cell in percentage coordinates. */
function centre(index: number) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return { x: ((col * 2 + 1) / 6) * 100, y: ((row * 2 + 1) / 6) * 100 };
}

/** Tic-tac-toe against an unbeatable-ish AI or a friend on one device. */
export function TicTacToe() {
  const record = useRecordScore();
  const [mode, setMode] = useState<Mode>("ai");
  const [board, setBoard] = useState<(string | null)[]>(EMPTY);
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [tally, setTally] = useState({ x: 0, o: 0, draw: 0 });
  const [drawLine, setDrawLine] = useState(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const win = winningLine(board);
  const full = board.every(Boolean);
  const result = win ? win.winner : full ? "draw" : null;

  // AI move
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

  // End of match: score, celebrate, animate line, auto reset
  useEffect(() => {
    if (!result) return;

    setTally((t) =>
      result === "draw"
        ? { ...t, draw: t.draw + 1 }
        : result === "X"
          ? { ...t, x: t.x + 1 }
          : { ...t, o: t.o + 1 },
    );

    const raf = requestAnimationFrame(() => setDrawLine(true));

    if (modeRef.current === "ai") {
      const won = result === "X";
      if (won) void confetti({ particleCount: 80, spread: 65, origin: { y: 0.7 } });
      record.mutate(
        { game: "tictactoe", score: won ? 1 : 0, won },
        { onSuccess: (res) => res.points && toast.success(`+${res.points} points!`) },
      );
    } else if (result !== "draw") {
      void confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }

    const timer = setTimeout(() => {
      setDrawLine(false);
      setBoard(EMPTY);
      setTurn("X");
    }, 2600);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
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
    setDrawLine(false);
    setBoard(EMPTY);
    setTurn("X");
  }

  const from = win ? centre(win.line[0]!) : null;
  const to = win ? centre(win.line[2]!) : null;

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

      <div className="relative mx-auto mt-4 grid max-w-[280px] grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWinning = win?.line.includes(i);
          return (
            <button
              key={i}
              aria-label={`Cell ${i + 1}`}
              disabled={Boolean(result)}
              className={`press flex aspect-square items-center justify-center rounded-2xl text-3xl font-black transition-colors duration-300 ${
                isWinning ? "bg-primary/25 ring-primary/60 ring-2" : "bg-secondary text-secondary-foreground"
              }`}
              onClick={() => play(i)}
            >
              <span className={cell === "X" ? "text-primary" : ""}>{cell}</span>
            </button>
          );
        })}

        {from && to && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={drawLine ? 0 : 1}
              className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
              strokeWidth={3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      <p className="text-foreground mt-3 text-center text-base font-extrabold">
        {result
          ? result === "draw"
            ? "🤝 It's a Draw!"
            : `🎉 Player ${result} Wins!`
          : `${turn}'s turn`}
      </p>
      {result && <p className="text-muted-foreground mt-0.5 text-center text-xs">New round starting…</p>}

      <div className="bg-secondary mt-3 grid grid-cols-3 gap-2 rounded-2xl p-3 text-center">
        <div>
          <p className="text-primary text-lg font-black">{tally.x}</p>
          <p className="text-muted-foreground text-[11px] font-semibold">Player X wins</p>
        </div>
        <div>
          <p className="text-secondary-foreground text-lg font-black">{tally.o}</p>
          <p className="text-muted-foreground text-[11px] font-semibold">
            {mode === "ai" ? "AI wins" : "Player O wins"}
          </p>
        </div>
        <div>
          <p className="text-secondary-foreground text-lg font-black">{tally.draw}</p>
          <p className="text-muted-foreground text-[11px] font-semibold">Draws</p>
        </div>
      </div>
    </div>
  );
}
