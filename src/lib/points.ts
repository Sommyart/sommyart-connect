/** Client-safe points, level and rank definitions for SOMMYART CONNECT. */

export const POINT_RULES = {
  start_discussion: 5,
  complete_challenge: 10,
  help_member: 15,
  win_weekly_challenge: 50,
  host_session: 100,
} as const;

export type PointReason = keyof typeof POINT_RULES;

export const POINT_LABELS: Record<PointReason, string> = {
  start_discussion: "Start a discussion",
  complete_challenge: "Complete a challenge",
  help_member: "Help another member",
  win_weekly_challenge: "Win a weekly challenge",
  host_session: "Host a session",
};

export type LevelDef = { min: number; name: string; icon: string };

export const LEVELS: LevelDef[] = [
  { min: 0, name: "Explorer", icon: "compass" },
  { min: 150, name: "Builder", icon: "wrench" },
  { min: 400, name: "Creator", icon: "palette" },
  { min: 900, name: "Innovator", icon: "rocket" },
  { min: 1800, name: "Mentor", icon: "brain" },
  { min: 3500, name: "Luminary", icon: "crown" },
];

export function levelFor(points: number) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (points >= level.min) index = i;
  });
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(100, Math.round(((points - current.min) / span) * 100)) : 100;
  return { ...current, level: index + 1, next, progress };
}

export const WEEKLY_TRACKS = [
  {
    day: 0,
    key: "mission_sunday",
    label: "Sunday",
    title: "Mission Sunday",
    tagline: "Set your weekly AI goal",
    prompt: "What's one AI or tech project you'll complete this week?",
    icon: "target",
  },
  {
    day: 1,
    key: "ai_tool_challenge",
    label: "Monday",
    title: "AI Tool Challenge",
    tagline: "One tool. 24 hours. Build something.",
    prompt: "Build something using this week's featured AI tool.",
    icon: "wrench",
  },
  {
    day: 2,
    key: "tech_challenge_tuesday",
    label: "Tuesday",
    title: "Tech Challenge Tuesday",
    tagline: "Same challenge, everyone",
    prompt: "Complete today's community-wide tech challenge.",
    icon: "zap",
  },
  {
    day: 3,
    key: "wip_wednesday",
    label: "Wednesday",
    title: "Work-in-Progress Wednesday",
    tagline: "Share and review two projects",
    prompt: "Post your work in progress, then review two others.",
    icon: "flask",
  },
  {
    day: 4,
    key: "knowledge_exchange",
    label: "Thursday",
    title: "Knowledge Exchange",
    tagline: "Teach a 5–10 minute lesson",
    prompt: "Host or attend a community lesson.",
    icon: "book",
  },
  {
    day: 5,
    key: "demo_day",
    label: "Friday",
    title: "Demo Day",
    tagline: "Showcase and vote",
    prompt: "Show what you finished this week.",
    icon: "flag",
  },
] as const;

export type TrackKey = (typeof WEEKLY_TRACKS)[number]["key"];

export const VOTE_CATEGORIES = [
  { key: "project_of_the_week", label: "Project of the Week", icon: "trophy" },
  { key: "best_design", label: "Best Design", icon: "palette" },
  { key: "best_ai_workflow", label: "Best AI Workflow", icon: "bot" },
  { key: "most_innovative", label: "Most Innovative Idea", icon: "lightbulb" },
] as const;

export function trackForToday(date = new Date()): (typeof WEEKLY_TRACKS)[number] {
  const day = date.getDay();
  return WEEKLY_TRACKS.find((t) => t.day === day) ?? WEEKLY_TRACKS[0];
}
