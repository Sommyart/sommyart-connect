CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_date date NOT NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  bonus_awarded integer NOT NULL DEFAULT 0,
  streak_after integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_date)
);

GRANT SELECT ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own sign-ins"
  ON public.check_ins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all sign-ins"
  ON public.check_ins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX check_ins_user_date_idx ON public.check_ins (user_id, check_date DESC);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;