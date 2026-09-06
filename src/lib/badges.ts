/** Client-safe badge definitions earned from community activity. */

export type BadgeStats = {
  points: number;
  streak: number;
  longestStreak: number;
  totalSignIns: number;
  posts: number;
  projects: number;
};

export type Badge = {
  key: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
};

export function badgesFor(stats: BadgeStats): Badge[] {


  const list: (Omit<Badge, "earned"> & { earned: boolean })[] = [
    {
      key: "first_steps",
      name: "First Steps",
      icon: "footprints",
      description: "Signed in for the first time",
      earned: stats.totalSignIns >= 1,
    },
    {
      key: "week_warrior",
      name: "Week Warrior",
      icon: "flame",
      description: "7-day sign-in streak",
      earned: stats.longestStreak >= 7,
    },
    {
      key: "month_master",
      name: "Month Master",
      icon: "star",
      description: "30-day sign-in streak",
      earned: stats.longestStreak >= 30,
    },
    {
      key: "community_legend",
      name: "Community Legend",
      icon: "crown",
      description: "100-day sign-in streak",
      earned: stats.longestStreak >= 100,
    },
    {
      key: "voice",
      name: "Community Voice",
      icon: "message",
      description: "Published 5 posts",
      earned: stats.posts >= 5,
    },
    {
      key: "shipper",
      name: "Shipper",
      icon: "rocket",
      description: "Published 3 projects",
      earned: stats.projects >= 3,
    },
    {
      key: "bronze",
      name: "Bronze",
      icon: "medal-bronze",
      description: "Earned 150 points",
      earned: stats.points >= 150,
    },
    {
      key: "silver",
      name: "Silver",
      icon: "medal-silver",
      description: "Earned 500 points",
      earned: stats.points >= 500,
    },
    {
      key: "gold",
      name: "Gold",
      icon: "medal-gold",
      description: "Earned 1500 points",
      earned: stats.points >= 1500,
    },
  ];

  return list;
}
