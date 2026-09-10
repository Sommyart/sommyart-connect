import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Brain, Code2, Gamepad2, Grid3X3, Keyboard, Puzzle, Sparkles, Swords, Timer, Trophy, Wrench } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Media";
import { CodeChallenge } from "@/components/games/CodeChallenge";
import { LogicGame } from "@/components/games/LogicGame";
import { PromptBattle } from "@/components/games/PromptBattle";
import { QuizGame } from "@/components/games/QuizGame";
import { RiddleCorner } from "@/components/games/RiddleCorner";
import { TicTacToe } from "@/components/games/TicTacToe";
import { ToolGuess } from "@/components/games/ToolGuess";
import { Trivia } from "@/components/games/Trivia";
import { TypingChallenge } from "@/components/games/TypingChallenge";
import { useAdminIds, useMe } from "@/hooks/use-auth";
import { useGameLeaderboard, useMyGameStats } from "@/hooks/use-games";
import { GAMES, type GameKey } from "@/lib/games";
import { levelFor } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({
    meta: [
      { title: "Game Center — SOMMYART CONNECT" },
      {
        name: "description",
        content:
          "Play the daily tech quiz, tic-tac-toe, AI tool guess and riddle corner — earn XP and climb the SOMMYART CONNECT game leaderboards.",
      },
      { property: "og:title", content: "Game Center — SOMMYART CONNECT" },
      { property: "og:description", content: "Daily AI games, XP and top-10 leaderboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { user, profile } = useMe();
  const [game, setGame] = useState<GameKey>("quiz");
  const { data: stats } = useMyGameStats(user?.id);
  const { data: top = [] } = useGameLeaderboard(game);
  const { data: adminIds = new Set<string>() } = useAdminIds(top.map((row) => row.user_id));
  const level = levelFor(profile?.points ?? 0);
  const active = GAMES.find((g) => g.key === game)!;
  const gameIcons = { brain: Brain, grid: Grid3X3, wrench: Wrench, puzzle: Puzzle, swords: Swords, keyboard: Keyboard, code: Code2, timer: Timer } as const;
  const ActiveIcon = gameIcons[active.icon];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 pt-6 pb-32 sm:px-6 md:max-w-3xl md:px-8 md:pt-10 lg:max-w-5xl xl:max-w-6xl">
      <h1 className="text-foreground flex items-center gap-2 text-2xl font-extrabold">
        <Gamepad2 className="text-primary h-6 w-6" aria-hidden /> Game Center
      </h1>

      <section className="bg-gradient-brand text-primary-foreground shadow-glow mt-4 grid grid-cols-3 gap-2 rounded-3xl p-5 text-center">
        <div>
          <p className="text-2xl font-black">{stats?.xp ?? 0}</p>
          <p className="text-[11px] font-semibold opacity-90">XP</p>
        </div>
        <div>
          <p className="text-2xl font-black">{stats?.plays ?? 0}</p>
          <p className="text-[11px] font-semibold opacity-90">Games played</p>
        </div>
        <div>
          <p className="text-2xl font-black">
            <span className="text-2xl font-black">{level.level}</span>
          </p>
          <p className="text-[11px] font-semibold opacity-90">{level.name}</p>
        </div>
      </section>

      <div className="mt-4 grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-0.5 md:max-h-none md:grid-cols-3 lg:grid-cols-4 lg:overflow-visible">
        {GAMES.map((g) => (
          <button
            key={g.key}
            onClick={() => setGame(g.key)}
            className={`press rounded-2xl border p-3 text-left ${
              game === g.key ? "border-primary/50 bg-primary/10" : "border-border/60 bg-card/85"
            }`}
          >
            {(() => { const Icon = gameIcons[g.icon]; return <Icon className="text-primary h-5 w-5" aria-hidden />; })()}
            <p className="text-card-foreground text-sm font-bold">{g.name}</p>
            <p className="text-muted-foreground text-[11px] leading-tight">{g.blurb}</p>
            <p className="text-primary mt-1 text-[11px] font-extrabold">+{g.points} pts</p>
          </button>
        ))}
      </div>

      <section className="bg-card/85 shadow-card border-border/60 animate-fade-up mt-5 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
          <Sparkles className="text-primary h-5 w-5" aria-hidden /> {active.name}
        </h2>
        <div className="mt-4">
          {game === "quiz" && <QuizGame />}
          {game === "tictactoe" && <TicTacToe />}
          {game === "toolguess" && <ToolGuess />}
          {game === "riddle" && <RiddleCorner />}
          {game === "promptbattle" && <PromptBattle />}
          {game === "typing" && <TypingChallenge />}
          {game === "code" && <CodeChallenge />}
          {game === "logic" && <LogicGame />}
          {game === "trivia" && <Trivia />}
        </div>
      </section>

      <section className="bg-card/85 shadow-card border-border/60 mt-5 rounded-3xl border p-5 backdrop-blur-xl">
        <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
          <Trophy className="text-primary h-5 w-5" aria-hidden /> Top 10 — {active.name}
        </h2>
        <div className="mt-3 space-y-2">
          {top.length === 0 && <p className="text-muted-foreground text-sm">No scores yet — play first.</p>}
          {top.map((row, i) => (
            <div key={row.user_id} className="bg-secondary flex items-center gap-3 rounded-2xl p-2.5">
              <span className="text-primary w-5 text-center text-sm font-extrabold">{i + 1}</span>
              <Avatar path={row.profiles?.avatar_url} name={row.profiles?.full_name ?? "SC"} size={32} />
              <p className="text-secondary-foreground min-w-0 flex-1 truncate text-sm font-bold">
                 <span className="truncate">{row.profiles?.full_name ?? "Member"}</span>
                 {adminIds.has(row.user_id) && <AdminBadge compact />}
              </p>
              <span className="text-primary text-sm font-extrabold">{row.score}</span>
            </div>
          ))}
        </div>
      </section>

      <AppNav />
    </main>
  );
}
