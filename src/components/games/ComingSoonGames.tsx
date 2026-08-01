import { Gamepad2 } from "lucide-react";

const FUTURE = [
  "Snake",
  "Memory Match",
  "Hangman",
  "Ludo",
  "Chess",
  "Connect Four",
  "Word Search",
  "Sudoku",
  "Number Puzzle",
];

export function ComingSoonGames() {
  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
        <Gamepad2 className="text-primary h-5 w-5" aria-hidden /> More games coming
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        The Fun Zone is built to grow — these arrive in future updates.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FUTURE.map((game) => (
          <span
            key={game}
            className="bg-secondary text-muted-foreground rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            {game}
          </span>
        ))}
      </div>
    </section>
  );
}
