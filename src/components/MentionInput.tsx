import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Suggestion = { id: string; username: string; full_name: string };

function activeHandle(value: string, caret: number) {
  const upto = value.slice(0, caret);
  const match = /@([A-Za-z0-9_.]{1,30})$/.exec(upto);
  return match ? match[1]! : null;
}

/** Text field with @mention suggestions pulled from member usernames. */
export function MentionInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  multiline = false,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [caret, setCaret] = useState(0);
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => setQuery(activeHandle(value, caret)), [value, caret]);

  const { data: people = [] } = useQuery({
    queryKey: ["mention-search", query],
    enabled: Boolean(query && query.length >= 1),
    queryFn: async (): Promise<Suggestion[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,full_name")
        .ilike("username", `${query}%`)
        .limit(5);
      return (data ?? []) as Suggestion[];
    },
  });

  function pick(username: string) {
    const upto = value.slice(0, caret).replace(/@([A-Za-z0-9_.]{1,30})$/, `@${username} `);
    const next = upto + value.slice(caret);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => ref.current?.focus());
  }

  const shared = {
    ref,
    value,
    placeholder,
    "aria-label": ariaLabel,
    className: `rounded-2xl ${className}`,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(e.target.value);
      setCaret(e.target.selectionStart ?? e.target.value.length);
    },
    onKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      setCaret(e.currentTarget.selectionStart ?? 0),
    onClick: (e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) =>
      setCaret(e.currentTarget.selectionStart ?? 0),
  };

  return (
    <div className="relative">
      {multiline ? <Textarea rows={rows} {...shared} /> : <Input {...shared} />}
      {query && people.length > 0 && (
        <ul className="bg-popover border-border/60 shadow-card absolute z-30 mt-1 w-full overflow-hidden rounded-2xl border">
          {people.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="press hover:bg-secondary w-full px-3 py-2 text-left text-sm"
                onClick={() => pick(person.username)}
              >
                <span className="text-popover-foreground font-bold">@{person.username}</span>{" "}
                <span className="text-muted-foreground">{person.full_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Renders @handles inside body text with brand highlighting. */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(@[A-Za-z0-9_.]{2,30})/g);
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, index) =>
        part.startsWith("@") ? (
          <span key={index} className="text-primary font-bold">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}
