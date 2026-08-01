import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Bot, RotateCcw, Users, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAwardPoints } from "@/hooks/use-games";

type Cell = "X" | "O" | null;
type Mode = "ai" | "friend";
type Level = "easy" | "medium" | "hard";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const STATS_KEY = "awka-ttt-stats";

type Stats = { played: number; wins: number; losses: number; draws: number; streak: number; best: number };
const EMPTY: Stats = { played: 0, wins: 0, losses: 0, draws: 0, streak: 0, best: 0 };

function winnerOf(b: Cell[]): { mark: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line as [number, number, number];
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a]!, line };
  }
  return null;
}

function minimax(b: Cell[], me: "X" | "O", turn: "X" | "O"): number {
  const w = winnerOf(b);
  if (w) return w.mark === me ? 1 : -1;
  if (b.every(Boolean)) return 0;
  const scores = b
    .map((c, i) => (c ? null : i))
    .filter((i): i is number => i !== null)
    .map((i) => {
      const next = [...b];
      next[i] = turn;
      return minimax(next, me, turn === "X" ? "O" : "X");
    });
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(b: Cell[], me: "X" | "O", level: Level): number {
  const free = b.map((c, i) => (c ? null : i)).filter((i): i is number => i !== null);
  if (!free.length) return -1;
  const random = free[Math.floor(Math.random() * free.length)]!;
  if (level === "easy" && Math.random() < 0.75) return random;
  if (level === "medium" && Math.random() < 0.35) return random;
  let choice = random;
  let bestScore = -Infinity;
  for (const i of free) {
    const next = [...b];
    next[i] = me;
    const score = minimax(next, me, me === "X" ? "O" : "X");
    if (score > bestScore) {
      bestScore = score;
      choice = i;
    }
  }
  return choice;
}

export function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [mode, setMode] = useState<Mode>("ai");
  const [level, setLevel] = useState<Level>("medium");
  const [sound, setSound] = useState(true);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const settled = useRef(false);
  const award = useAwardPoints();

  useEffect(() => {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        setStats({ ...EMPTY, ...(JSON.parse(raw) as Stats) });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = useCallback((next: Stats) => {
    setStats(next);
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  }, []);

  const beep = useCallback(
    (freq: number) => {
      if (!sound) return;
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {
        /* audio unsupported */
      }
    },
    [sound],
  );

  const result = useMemo(() => winnerOf(board), [board]);
  const draw = !result && board.every(Boolean);

  useEffect(() => {
    if (settled.current) return;
    if (!result && !draw) return;
    settled.current = true;

    if (draw) {
      beep(240);
      persist({ ...stats, played: stats.played + 1, draws: stats.draws + 1, streak: 0 });
      return;
    }
    const playerWon = mode === "friend" || result!.mark === "X";
    if (playerWon) {
      beep(660);
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
      const streak = stats.streak + 1;
      persist({
        ...stats,
        played: stats.played + 1,
        wins: stats.wins + 1,
        streak,
        best: Math.max(stats.best, streak),
      });
      if (mode === "ai") award.mutate({ reason: "ttt_ai_win" });
    } else {
      beep(180);
      persist({ ...stats, played: stats.played + 1, losses: stats.losses + 1, streak: 0 });
    }
  }, [result, draw, mode, beep, persist, stats, award]);

  useEffect(() => {
    if (mode !== "ai" || turn !== "O" || result || draw) return;
    const id = setTimeout(() => {
      const move = bestMove(board, "O", level);
      if (move < 0) return;
      setBoard((prev) => {
        const next = [...prev];
        next[move] = "O";
        return next;
      });
      setTurn("X");
      beep(380);
    }, 420);
    return () => clearTimeout(id);
  }, [board, turn, mode, level, result, draw, beep]);

  function play(i: number) {
    if (board[i] || result || draw) return;
    if (mode === "ai" && turn !== "X") return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    setTurn(turn === "X" ? "O" : "X");
    beep(520);
  }

  function reset() {
    settled.current = false;
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  const status = result
    ? mode === "ai"
      ? result.mark === "X"
        ? "🎉 You win! +8 AWKA Points"
        : "🤖 AI wins this round"
      : `🎉 Player ${result.mark} wins!`
    : draw
      ? "🤝 It's a draw"
      : mode === "ai"
        ? turn === "X"
          ? "Your turn (X)"
          : "AI thinking…"
        : `Player ${turn}'s turn`;

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-card-foreground text-lg font-extrabold">Tic Tac Toe</h2>
        <button
          className="text-muted-foreground hover:text-primary press p-1"
          aria-label={sound ? "Mute sound" : "Unmute sound"}
          onClick={() => setSound((s) => !s)}
        >
          {sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "ai" ? "default" : "secondary"}
          className="press rounded-xl"
          onClick={() => {
            setMode("ai");
            reset();
          }}
        >
          <Bot className="mr-1 h-4 w-4" aria-hidden /> vs AI
        </Button>
        <Button
          size="sm"
          variant={mode === "friend" ? "default" : "secondary"}
          className="press rounded-xl"
          onClick={() => {
            setMode("friend");
            reset();
          }}
        >
          <Users className="mr-1 h-4 w-4" aria-hidden /> vs Friend
        </Button>
        {mode === "ai" &&
          (["easy", "medium", "hard"] as Level[]).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={level === l ? "default" : "secondary"}
              className="press rounded-xl capitalize"
              onClick={() => {
                setLevel(l);
                reset();
              }}
            >
              {l}
            </Button>
          ))}
      </div>

      <p className="text-muted-foreground mt-3 text-center text-sm font-semibold">{status}</p>

      <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const win = result?.line.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              aria-label={`Cell ${i + 1}`}
              className={`press flex aspect-square items-center justify-center rounded-2xl text-3xl font-black transition-all duration-200 ${
                win
                  ? "bg-gradient-brand text-primary-foreground shadow-glow scale-105"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <span className={cell ? "animate-fade-up inline-block" : ""}>{cell}</span>
            </button>
          );
        })}
      </div>

      <Button className="press mt-4 h-11 w-full rounded-2xl" onClick={reset}>
        <RotateCcw className="mr-1 h-4 w-4" aria-hidden /> Restart game
      </Button>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {[
          ["Played", stats.played],
          ["Wins", stats.wins],
          ["Losses", stats.losses],
          ["Draws", stats.draws],
          ["Streak", stats.streak],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-secondary rounded-2xl px-1 py-2">
            <p className="text-primary text-lg font-extrabold">{value}</p>
            <p className="text-muted-foreground text-[10px] font-semibold">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
