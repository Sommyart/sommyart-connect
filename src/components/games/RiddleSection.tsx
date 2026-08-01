import { useEffect, useMemo, useState } from "react";
import { Eye, Heart, Lightbulb, Share2, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { shuffle, useAwardPoints, useRiddles } from "@/hooks/use-games";

const CATEGORIES = [
  "any",
  "Easy",
  "Funny",
  "Tricky",
  "IQ",
  "Logic",
  "Nigerian",
  "Bible",
  "Kids",
  "Adult Friendly",
];

const FAV_KEY = "awka-riddle-favourites";

export function RiddleSection() {
  const [category, setCategory] = useState("any");
  const { data: pool = [] } = useRiddles(category);
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [favourites, setFavourites] = useState<string[]>([]);
  const award = useAwardPoints();

  useEffect(() => {
    const raw = localStorage.getItem(FAV_KEY);
    if (raw) {
      try {
        setFavourites(JSON.parse(raw) as string[]);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    setOrder(shuffle(pool.map((_, i) => i)));
    setPos(0);
    setRevealed(false);
  }, [pool]);

  const riddle = useMemo(() => pool[order[pos] ?? 0], [pool, order, pos]);
  const daily = useMemo(() => {
    if (!pool.length) return null;
    const day = Math.floor(Date.now() / 86_400_000);
    return pool[day % pool.length]!;
  }, [pool]);

  function next(random = false) {
    setRevealed(false);
    setPos((p) => (random ? Math.floor(Math.random() * Math.max(order.length, 1)) : (p + 1) % Math.max(order.length, 1)));
  }

  function toggleFavourite(id: string) {
    const next = favourites.includes(id) ? favourites.filter((f) => f !== id) : [...favourites, id];
    setFavourites(next);
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  async function share() {
    if (!riddle) return;
    const text = `🤔 AWKA CONNECT Riddle: ${riddle.question}`;
    try {
      if (navigator.share) await navigator.share({ text, title: "AWKA CONNECT Riddle" });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Riddle copied — share it in the group!");
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <section className="bg-card/85 shadow-card border-border/60 rounded-3xl border p-5 backdrop-blur-xl">
      <h2 className="text-card-foreground flex items-center gap-2 text-lg font-extrabold">
        <Lightbulb className="text-primary h-5 w-5" aria-hidden /> Riddle Corner
      </h2>

      <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "secondary"}
            className="press shrink-0 rounded-xl"
            onClick={() => setCategory(c)}
          >
            {c === "any" ? "All" : c}
          </Button>
        ))}
      </div>

      {riddle ? (
        <div className="animate-fade-up bg-secondary mt-4 rounded-3xl p-5">
          <p className="text-primary text-[11px] font-bold tracking-widest uppercase">
            {riddle.category}
          </p>
          <p className="text-secondary-foreground mt-2 text-base font-bold">{riddle.question}</p>

          {revealed ? (
            <p className="text-primary animate-fade-up mt-3 text-sm font-extrabold">
              💡 {riddle.answer}
            </p>
          ) : (
            <Button
              variant="secondary"
              className="press bg-card mt-3 h-10 rounded-2xl"
              onClick={() => {
                setRevealed(true);
                award.mutate({ reason: "riddle" });
              }}
            >
              <Eye className="mr-1 h-4 w-4" aria-hidden /> Reveal answer (+5 pts)
            </Button>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="press rounded-xl" onClick={() => next()}>
              Next riddle
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="press bg-card rounded-xl"
              onClick={() => next(true)}
            >
              <Shuffle className="mr-1 h-4 w-4" aria-hidden /> Random
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="press bg-card rounded-xl"
              onClick={() => toggleFavourite(riddle.id)}
            >
              <Heart
                className={`mr-1 h-4 w-4 ${favourites.includes(riddle.id) ? "fill-primary text-primary" : ""}`}
                aria-hidden
              />
              {favourites.includes(riddle.id) ? "Saved" : "Favourite"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="press bg-card rounded-xl"
              onClick={() => void share()}
            >
              <Share2 className="mr-1 h-4 w-4" aria-hidden /> Share
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">No riddles in this category yet.</p>
      )}

      {daily && (
        <div className="border-primary/30 bg-primary/5 mt-4 rounded-3xl border border-dashed p-4">
          <p className="text-primary text-[11px] font-bold tracking-widest uppercase">
            Riddle of the day
          </p>
          <p className="text-card-foreground mt-1 text-sm font-semibold">{daily.question}</p>
        </div>
      )}
    </section>
  );
}
