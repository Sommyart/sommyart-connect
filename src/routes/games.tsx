import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2, Sparkles } from "lucide-react";

import { AppFooter } from "@/components/AppFooter";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComingSoonGames } from "@/components/games/ComingSoonGames";
import { DailyChallenge } from "@/components/games/DailyChallenge";
import { Leaderboard } from "@/components/games/Leaderboard";
import { QuizSection } from "@/components/games/QuizSection";
import { RiddleSection } from "@/components/games/RiddleSection";
import { TicTacToe } from "@/components/games/TicTacToe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameProfile } from "@/hooks/use-games";

export const Route = createFileRoute("/games")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Games & Fun Zone | AWKA CONNECT" },
      {
        name: "description",
        content:
          "Play Tic Tac Toe, quiz challenges and riddles, earn AWKA Points and climb the AWKA CONNECT community leaderboard.",
      },
      { property: "og:title", content: "Games & Fun Zone | AWKA CONNECT" },
      {
        property: "og:description",
        content: "Tic Tac Toe, quizzes, riddles, daily challenges and the AWKA Points leaderboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const { data: profile } = useGameProfile();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 pb-32">
      <header className="flex items-center gap-3">
        <Logo size={44} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-lg font-extrabold">Games & Fun Zone</h1>
          <p className="text-muted-foreground text-xs">Play • Earn AWKA Points • Win badges</p>
        </div>
        <ThemeToggle />
      </header>

      {profile && (
        <section className="bg-gradient-brand text-primary-foreground shadow-glow animate-fade-up mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold opacity-90">Your AWKA Points</p>
              <p className="text-4xl font-black">{profile.total_points}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold">
                {profile.tier.emoji} {profile.tier.badge}
              </p>
              <p className="text-xs opacity-90">
                {profile.quizzes_played} quizzes • {profile.games_won} wins
              </p>
            </div>
          </div>
          {profile.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.badges.map((b) => (
                <span key={b} className="bg-white/20 rounded-lg px-2 py-1 text-[10px] font-bold">
                  {b}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-5">
        <DailyChallenge />
      </div>

      <Tabs defaultValue="tictactoe" className="mt-5">
        <TabsList className="bg-card/85 flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl p-1.5 backdrop-blur-xl">
          {[
            ["tictactoe", "Tic Tac Toe"],
            ["quiz", "Quiz"],
            ["riddles", "Riddles"],
            ["leaderboard", "Leaderboard"],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-gradient-brand data-[state=active]:text-primary-foreground flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tictactoe" className="mt-4">
          <TicTacToe />
        </TabsContent>
        <TabsContent value="quiz" className="mt-4">
          <QuizSection />
        </TabsContent>
        <TabsContent value="riddles" className="mt-4">
          <RiddleSection />
        </TabsContent>
        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard />
        </TabsContent>
      </Tabs>

      <div className="mt-5 space-y-5">
        <ComingSoonGames />
        <p className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <Sparkles className="h-4 w-4" aria-hidden /> Sign in daily for +5 points and streak
          bonuses
          <Gamepad2 className="h-4 w-4" aria-hidden />
        </p>
      </div>

      <AppFooter />
      <BottomNav />
    </main>
  );
}
