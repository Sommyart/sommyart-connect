import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRecordScore } from "@/hooks/use-games";
import { dailyIndex, PROMPT_BRIEFS, scorePrompt } from "@/lib/games";

/** Write a prompt for a creative brief; scored client-side on specificity heuristics. */
export function PromptBattle() {
  const record = useRecordScore();
  const [brief] = useState(() => PROMPT_BRIEFS[dailyIndex(PROMPT_BRIEFS.length, `${Date.now()}`)]!);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ score: number; tips: string[] } | null>(null);

  function submit() {
    if (!text.trim()) return;
    const scored = scorePrompt(text);
    setResult(scored);
    record.mutate(
      { game: "promptbattle", score: scored.score },
      { onSuccess: (res) => toast.success(res.points ? `+${res.points} points!` : `Scored ${scored.score}/100`) },
    );
  }

  function retry() {
    setText("");
    setResult(null);
  }

  return (
    <div>
      <p className="bg-secondary text-secondary-foreground rounded-2xl p-3 text-sm font-semibold">{brief}</p>
      <Textarea
        className="mt-3 rounded-2xl"
        rows={4}
        placeholder="Write your best prompt for this brief…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={Boolean(result)}
      />
      {!result ? (
        <Button className="press mt-3 w-full rounded-2xl" onClick={submit} disabled={!text.trim()}>
          Score my prompt
        </Button>
      ) : (
        <div className="mt-3 text-center">
          <p className="text-primary text-5xl font-black">{result.score}</p>
          <p className="text-muted-foreground text-xs">/ 100 specificity score</p>
          <ul className="mt-3 space-y-1 text-left">
            {result.tips.map((tip) => (
              <li key={tip} className="text-secondary-foreground bg-secondary rounded-xl p-2 text-xs font-semibold">
                {tip}
              </li>
            ))}
          </ul>
          <Button className="press mt-4 rounded-2xl" onClick={retry}>
            Try another brief
          </Button>
        </div>
      )}
    </div>
  );
}
