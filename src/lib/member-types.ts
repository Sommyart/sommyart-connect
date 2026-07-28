export type PublicMember = {
  id: string;
  real_name: string;
  nickname: string;
  birth_day: number;
  birth_month: number;
  occupation: string;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type Activity = {
  id: string;
  day: number;
  title: string;
  description: string;
  image: string | null;
  is_active: boolean;
};

export type Winner = {
  id: string;
  activity: string;
  winner_name: string;
  winner_image: string | null;
  congratulation_message: string | null;
  date: string;
};
