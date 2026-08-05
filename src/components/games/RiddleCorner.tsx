import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRecordScore } from "@/hooks/use-games";
import { dailyIndex, RIDDLES } from "@/lib/games";

/** One shared riddle per day with a reveal button. */
export function RiddleCorner() {
  const record = useRecordScore();
  const riddle = RIDDLES[dailyIndex(RIDDLES.length)]!;
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <p className="text-card-foreground text-base font-bold">{riddle.q}</p>
      {revealed ? (
        <p className="bg-secondary text-secondary-foreground mt-3 rounded-2xl p-3 text-sm font-semibold">
          {riddle.a}
        </p>
      ) : (
        <Button
          className="press mt-4 rounded-2xl"
          onClick={() => {
            setRevealed(true);
            record.mutate(
              { game: "riddle", score: 1 },
              { onSuccess: (res) => res.points && toast.success(`+${res.points} points for today's riddle`) },
            );
          }}
        >
          Reveal answer
        </Button>
      )}
      <p className="text-muted-foreground mt-3 text-xs">A new riddle unlocks every day.</p>
    </div>
  );
}
