/** Client-safe game content and rules for the SOMMYART Game Center. */

export const GAMES = [
  { key: "quiz", name: "Daily Tech Quiz", icon: "🧠", blurb: "Pick a category and difficulty", points: 10 },
  { key: "tictactoe", name: "Tic-Tac-Toe", icon: "⭕", blurb: "Beat the AI opponent", points: 8 },
  { key: "toolguess", name: "AI Tool Guess", icon: "🛠️", blurb: "Name the tool from the clue", points: 6 },
  { key: "riddle", name: "Riddle Corner", icon: "🧩", blurb: "One tech riddle every day", points: 5 },
  { key: "promptbattle", name: "Prompt Battle", icon: "⚔️", blurb: "Write the best prompt for a brief", points: 8 },
  { key: "typing", name: "Typing Challenge", icon: "⌨️", blurb: "60s tech-quote typing test", points: 6 },
  { key: "code", name: "Code Challenge", icon: "💻", blurb: "What does this snippet output?", points: 8 },
  { key: "logic", name: "Logic Games", icon: "🧠", blurb: "Memorise the rising pattern", points: 6 },
  { key: "crossword", name: "Crossword", icon: "🔤", blurb: "Mini 5x5 AI & tech crossword", points: 10 },
  { key: "trivia", name: "Rapid Trivia", icon: "⏱️", blurb: "10 questions, race the clock", points: 10 },
] as const;

export type GameKey = (typeof GAMES)[number]["key"];

export type QuizQuestion = { q: string; options: string[]; answer: number; category: string };

export const QUIZ_BANK: QuizQuestion[] = [
  { category: "AI", q: "What does 'LLM' stand for?", options: ["Large Language Model", "Linear Learning Machine", "Logic Layer Module", "Long Latency Memory"], answer: 0 },
  { category: "Prompting", q: "Giving an AI a few worked examples in the prompt is called…", options: ["Zero-shot", "Few-shot", "Fine-tuning", "Chaining"], answer: 1 },
  { category: "AI", q: "Which of these is a text-to-image model?", options: ["Whisper", "Stable Diffusion", "BERT", "Pandas"], answer: 1 },
  { category: "AI", q: "A 'token' in an LLM is closest to…", options: ["A password", "A chunk of text", "A GPU core", "A dataset"], answer: 1 },
  { category: "Prompting", q: "Asking a model to 'think step by step' is known as…", options: ["Chain-of-thought", "Temperature", "Embedding", "Quantisation"], answer: 0 },
  { category: "Tech", q: "Which language runs natively in the browser?", options: ["Python", "JavaScript", "Rust", "Go"], answer: 1 },
  { category: "Tech", q: "What does API stand for?", options: ["Applied Program Input", "Application Programming Interface", "Automatic Process Integration", "App Protocol Index"], answer: 1 },
  { category: "AI", q: "Hallucination in AI means the model…", options: ["Crashes", "Invents false information", "Runs slowly", "Refuses to answer"], answer: 1 },
  { category: "AI", q: "Embeddings represent text as…", options: ["Images", "Vectors of numbers", "SQL rows", "HTML"], answer: 1 },
  { category: "Tech", q: "Git is primarily used for…", options: ["Version control", "Image editing", "Database hosting", "Video calls"], answer: 0 },
  { category: "AI", q: "Which company created ChatGPT?", options: ["OpenAI", "Meta", "IBM", "Adobe"], answer: 0 },
  { category: "Prompting", q: "Higher 'temperature' generally makes output…", options: ["More random", "Shorter", "More factual", "Slower"], answer: 0 },
  { category: "Tech", q: "A PWA can be…", options: ["Installed on a phone", "Only used offline", "Written in C only", "Printed"], answer: 0 },
  { category: "AI", q: "RAG stands for retrieval-augmented…", options: ["Grouping", "Generation", "Gradient", "Graphing"], answer: 1 },
  { category: "AI", q: "Which is an open-weight model family?", options: ["Llama", "Excel", "Figma", "Notion"], answer: 0 },
  { category: "Tech", q: "CSS is used to…", options: ["Style pages", "Query databases", "Compile code", "Send email"], answer: 0 },
  { category: "AI", q: "Speech-to-text is handled by models like…", options: ["Whisper", "Midjourney", "Sora", "DALL·E"], answer: 0 },
  { category: "Prompting", q: "A 'system prompt' usually sets the model's…", options: ["Role and rules", "Screen size", "Font", "Wi-Fi"], answer: 0 },
  { category: "Tech", q: "JSON is a format for…", options: ["Data exchange", "Video codecs", "3D printing", "Audio mixing"], answer: 0 },
  { category: "AI", q: "Fine-tuning means…", options: ["Training a model further on your data", "Deleting a model", "Compressing images", "Renaming files"], answer: 0 },
];

export const TOOL_CLUES: { clue: string; options: string[]; answer: number }[] = [
  { clue: "Chat assistant by OpenAI used by millions daily", options: ["ChatGPT", "Canva", "Slack", "Zoom"], answer: 0 },
  { clue: "Discord-based AI image generator known for painterly art", options: ["Midjourney", "Trello", "Notion", "Figma"], answer: 0 },
  { clue: "Design tool with collaborative vector editing", options: ["Figma", "Docker", "Postman", "Vercel"], answer: 0 },
  { clue: "AI pair programmer that autocompletes code in your editor", options: ["GitHub Copilot", "Photoshop", "Airtable", "Zapier"], answer: 0 },
  { clue: "Open-source model hub for weights and datasets", options: ["Hugging Face", "Dropbox", "Asana", "Stripe"], answer: 0 },
  { clue: "AI search engine that cites its sources", options: ["Perplexity", "Spotify", "Grammarly", "Loom"], answer: 0 },
  { clue: "Google's multimodal AI assistant", options: ["Gemini", "Sheets", "Meet", "Keep"], answer: 0 },
  { clue: "Realtime voice cloning and text-to-speech studio", options: ["ElevenLabs", "Miro", "Linear", "Retool"], answer: 0 },
];

export const RIDDLES: { q: string; a: string }[] = [
  { q: "I learn from everything but remember nothing between chats. What am I?", a: "A stateless language model" },
  { q: "I have keys but open no doors, space but no room. What am I?", a: "A keyboard" },
  { q: "The more you feed me, the smarter I look — but feed me junk and I embarrass you. What am I?", a: "A dataset" },
  { q: "I turn words into numbers so machines can compare meaning. What am I?", a: "An embedding" },
  { q: "I run in your browser, install like an app, and work offline. What am I?", a: "A PWA" },
  { q: "I am invisible instructions that shape every answer you get. What am I?", a: "A system prompt" },
  { q: "I never write code but I ship products daily by describing them. Who am I?", a: "A prompt engineer" },
];

/** Deterministic daily pick so everyone sees the same riddle each day. */
export function dailyIndex(length: number, seed = new Date().toISOString().slice(0, 10)) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return hash % length;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Minimax move for the tic-tac-toe AI. */
export function bestMove(board: (string | null)[], ai = "O", human = "X"): number {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  const winner = (b: (string | null)[]) => {
    for (const [a, c, d] of lines) if (b[a!] && b[a!] === b[c!] && b[a!] === b[d!]) return b[a!];
    return b.every(Boolean) ? "draw" : null;
  };
  const score = (b: (string | null)[], depth: number): number => {
    const w = winner(b);
    if (w === ai) return 10 - depth;
    if (w === human) return depth - 10;
    if (w === "draw") return 0;
    return NaN;
  };
  const minimax = (b: (string | null)[], turn: string, depth: number): number => {
    const s = score(b, depth);
    if (!Number.isNaN(s)) return s;
    const scores = b.map((cell, i) => {
      if (cell) return turn === ai ? -Infinity : Infinity;
      const next = [...b];
      next[i] = turn;
      return minimax(next, turn === ai ? human : ai, depth + 1);
    });
    return turn === ai ? Math.max(...scores) : Math.min(...scores);
  };

  let best = -Infinity;
  let move = board.findIndex((c) => !c);
  board.forEach((cell, i) => {
    if (cell) return;
    const next = [...board];
    next[i] = ai;
    const value = minimax(next, human, 0);
    if (value > best) {
      best = value;
      move = i;
    }
  });
  return move;
}

export const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/** Winner plus the winning triple, when there is one. */
export function winningLine(board: (string | null)[]): { winner: string; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line as [number, number, number];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a]!, line };
  }
  return null;
}

export function winnerOf(board: (string | null)[]): string | null {
  const win = winningLine(board);
  if (win) return win.winner;
  return board.every(Boolean) ? "draw" : null;
}

/** Creative briefs for the Prompt Battle game. */
export const PROMPT_BRIEFS: string[] = [
  "A cosy cyberpunk coffee shop at night, seen from the street.",
  "A minimalist logo for an AI music startup called 'Reverb'.",
  "A dramatic product shot of a perfume bottle for a fashion ad.",
  "A children's book illustration of a robot learning to paint.",
  "A cinematic portrait of an astronaut walking through a desert.",
  "A UI mockup for a meditation app's onboarding screen.",
];

/** Keywords that indicate a specific, well-structured prompt. */
export const PROMPT_KEYWORDS = [
  "style", "lighting", "camera", "mood", "color", "colour", "composition",
  "lens", "resolution", "detail", "angle", "background", "texture", "art",
];

/** Score a written prompt against the brief using simple heuristics (0-100). */
export function scorePrompt(text: string): { score: number; tips: string[] } {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const lower = trimmed.toLowerCase();
  const tips: string[] = [];

  let score = 0;
  if (words.length >= 8) score += 25;
  else tips.push("Add more detail — aim for at least 8 words.");
  if (words.length >= 18) score += 10;

  const keywordHits = PROMPT_KEYWORDS.filter((k) => lower.includes(k));
  score += Math.min(keywordHits.length * 10, 40);
  if (keywordHits.length === 0) tips.push("Mention style, lighting, camera or mood keywords.");

  const hasCommaStructure = trimmed.includes(",");
  if (hasCommaStructure) score += 10;
  else tips.push("Break the prompt into comma-separated descriptors.");

  const hasSubject = /\b(a|an|the)\b/i.test(trimmed);
  if (hasSubject) score += 10;

  if (words.length > 0 && trimmed[0] === trimmed[0]?.toUpperCase()) score += 5;

  score = Math.max(0, Math.min(100, score));
  if (score >= 80) tips.unshift("Excellent prompt craft!");
  return { score, tips };
}

/** Tech quotes for the typing challenge. */
export const TYPING_QUOTES: string[] = [
  "The best way to predict the future is to invent it, one prompt at a time.",
  "Artificial intelligence is the new electricity powering every modern product.",
  "Good design is as little design as possible, yet always intentional.",
  "Code is read far more often than it is written, so clarity always wins.",
  "A well crafted prompt is worth a thousand lines of manual editing.",
  "Automation frees creative people to focus on ideas instead of repetition.",
];

/** Multiple choice "what does this snippet output" questions. */
export const CODE_QUESTIONS: { code: string; options: string[]; answer: number }[] = [
  { code: "console.log(typeof null)", options: ["'object'", "'null'", "'undefined'", "'number'"], answer: 0 },
  { code: "console.log([1,2,3].map(x => x * 2))", options: ["[1,2,3]", "[2,4,6]", "[1,4,9]", "undefined"], answer: 1 },
  { code: "console.log(1 + '1')", options: ["2", "'11'", "NaN", "'2'"], answer: 1 },
  { code: "console.log([...new Set([1,1,2,3])])", options: ["[1,1,2,3]", "[1,2,3]", "{1,2,3}", "Error"], answer: 1 },
  { code: "console.log(0.1 + 0.2 === 0.3)", options: ["true", "false", "NaN", "Error"], answer: 1 },
  { code: "console.log([1,2,3].length)", options: ["2", "3", "4", "undefined"], answer: 1 },
  { code: "let a; console.log(a ?? 'x')", options: ["undefined", "'x'", "null", "Error"], answer: 1 },
  { code: "console.log('5' == 5)", options: ["true", "false", "Error", "NaN"], answer: 0 },
  { code: "console.log(typeof [])", options: ["'array'", "'object'", "'list'", "'undefined'"], answer: 1 },
  { code: "console.log(Boolean(''))", options: ["true", "false", "undefined", "Error"], answer: 1 },
];

/** 5x5 mini crossword: blocked cells marked '#', clues reference row/col start. */
export const CROSSWORD = {
  size: 5,
  grid: [
    "AI###",
    "PIXEL",
    "P#R#O",
    "S#O#M",
    "GPU##",
  ],
  clues: [
    { number: 1, dir: "across" as const, row: 1, col: 0, len: 5, clue: "Smallest unit of a digital image", answer: "PIXEL" },
    { number: 2, dir: "down" as const, row: 0, col: 0, len: 3, clue: "Abbreviation for Artificial Intelligence app", answer: "APP" },
    { number: 3, dir: "down" as const, row: 3, col: 4, len: 2, clue: "Short for 'multiuser online model'", answer: "OM" },
    { number: 4, dir: "across" as const, row: 4, col: 0, len: 3, clue: "Chip that renders graphics and trains AI", answer: "GPU" },
  ],
};
