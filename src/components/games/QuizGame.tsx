import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { useQuizBank, useQuizCategories, type QuizFilters } from "@/hooks/use-quiz-bank";

const DIFFICULTIES = ["Any", "Easy", "Medium", "Hard"] as const;
const COUNTS = [10, 20, 50] as const;

/** Setup screen + instant-scoring quiz backed by the quiz_questions bank. */
export function QuizGame() {
  const record = useRecordScore();
  const { data: categories = [] } = useQuizCategories();
  const [filters, setFilters] = useState<QuizFilters | null>(null);
  const { data: questions = [], isFetching } = useQuizBank(
    filters ?? { category: "All", difficulty: "Any", count: 10, mode: "practice" },
    Boolean(filters),
  );
  const activeFilters = filters;

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const scoreRef = useRef(0);

  function complete(final: number, total: number) {
    if (done) return;
    setDone(true);
    const scaled = Math.round((final / total) * 10);
    if (scaled >= 7) void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    if (activeFilters?.mode === "practice") {
      toast.success(`Practice complete: ${final}/${total}`);
      return;
    }
    record.mutate(
      { game: "quiz", score: scaled },
      {
        onSuccess: (res) => toast.success(res.points ? `+${res.points} points earned!` : `Scored ${final}/${total}`),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  useEffect(() => {
    if (!activeFilters || activeFilters.mode !== "timed" || questions.length === 0 || done) return;
    setTimeLeft(activeFilters.count * 15);
    setTimerStarted(true);
    const timer = window.setInterval(() => setTimeLeft((left) => Math.max(0, left - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [activeFilters, questions.length, done]);

  useEffect(() => {
    if (timerStarted && activeFilters?.mode === "timed" && timeLeft === 0 && questions.length > 0 && !done) {
      complete(scoreRef.current, questions.length);
    }
  }, [timeLeft, timerStarted, activeFilters, questions.length, done]);

  if (!filters) {
    return <QuizSetup categories={categories} onStart={setFilters} />;
  }

  if (isFetching || questions.length === 0) {
    return <div className="bg-muted h-40 animate-pulse rounded-2xl" />;
  }

  const total = questions.length;
  const question = questions[index]!;

  function choose(option: number) {
    if (picked !== null) return;
    setPicked(option);
    const correct = option === question.answer;
    if (correct) {
      scoreRef.current += 1;
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      if (index === total - 1) {
        complete(scoreRef.current, total);
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 700);
  }

  function restart() {
    setFilters(null);
    setIndex(0);
    setPicked(null);
    setScore(0);
    scoreRef.current = 0;
    setDone(false);
    setTimerStarted(false);
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-primary text-5xl font-black">
           {score}/{total}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {score / total >= 0.7 ? "Great work — points awarded (once a day)." : "Score 70%+ to earn points."}
        </p>
        <Button className="press mt-4 rounded-2xl" onClick={restart}>
          Play again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-muted-foreground flex items-center justify-between text-xs font-bold">
        <span>
           Question {index + 1}/{total} • {question.category}
        </span>
         <span>{filters.mode === "timed" ? `${timeLeft}s • ` : "Practice • "}Score {score}</span>
      </div>
      <div className="bg-secondary mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-gradient-brand h-full" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <p className="text-card-foreground mt-4 text-base font-bold">{question.q}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((option, i) => {
          const state =
            picked === null
              ? "bg-secondary text-secondary-foreground"
              : i === question.answer
                ? "bg-primary text-primary-foreground"
                : i === picked
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary text-secondary-foreground opacity-60";
          return (
            <button
              key={option}
              className={`press w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold ${state}`}
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

function QuizSetup({
  categories,
  onStart,
}: {
  categories: string[];
  onStart: (filters: QuizFilters) => void;
}) {
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Any");
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [mode, setMode] = useState<"practice" | "timed">("practice");

  return (
    <div>
      <p className="text-muted-foreground text-xs font-bold uppercase">Category</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`press rounded-xl px-3 py-1.5 text-xs font-bold ${
              category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground mt-4 text-xs font-bold uppercase">Difficulty</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`press rounded-xl px-3 py-1.5 text-xs font-bold ${
              difficulty === d ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground mt-4 text-xs font-bold uppercase">Questions</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COUNTS.map((n) => (
          <button
            key={n}
            onClick={() => setCount(n)}
            className={`press rounded-xl px-3 py-1.5 text-xs font-bold ${
              count === n ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground mt-4 text-xs font-bold uppercase">Mode</p>
      <div className="mt-2 flex gap-2">
        {(["practice", "timed"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`press rounded-xl px-3 py-1.5 text-xs font-bold capitalize ${
              mode === value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <Button className="press mt-5 w-full rounded-2xl" onClick={() => onStart({ category, difficulty, count, mode })}>
        Start quiz
      </Button>
    </div>
  );
}
