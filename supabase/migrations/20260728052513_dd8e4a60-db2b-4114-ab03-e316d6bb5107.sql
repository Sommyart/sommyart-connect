-- MEMBERS: auth fields
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS password_hint text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pin_reset_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- de-duplicate existing nicknames before enforcing uniqueness
UPDATE public.members m
SET nickname = m.nickname || '-' || left(m.id::text, 4)
WHERE EXISTS (
  SELECT 1 FROM public.members o
  WHERE lower(o.nickname) = lower(m.nickname)
    AND (o.created_at, o.id) < (m.created_at, m.id)
);

CREATE UNIQUE INDEX IF NOT EXISTS members_nickname_lower_key ON public.members (lower(nickname));

DROP POLICY IF EXISTS "Anyone can join the community" ON public.members;

-- SESSIONS
CREATE TABLE IF NOT EXISTS public.member_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '365 days'
);
GRANT ALL ON public.member_sessions TO service_role;
ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view sessions" ON public.member_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day smallint NOT NULL UNIQUE CHECK (day BETWEEN 0 AND 6),
  title text NOT NULL,
  description text NOT NULL,
  image text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities are public" ON public.activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update activities" ON public.activities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete activities" ON public.activities FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.activities (day, title, description) VALUES
  (1,'Monday Motivational Quotes & Lectures','Drop your favourite quote and tell us why it matters to you.'),
  (2,'Business Spotlight','Promote your business to the whole community.'),
  (3,'Woman Crush Wednesday (WCW)','Ladies post their pictures. Highest reactions wins.'),
  (4,'Throwback Thursday','Share old and new pictures. Celebrate your growth.'),
  (5,'Freaky Friday','Get freaky. Wild. Free. But with respect.'),
  (6,'Anonymous Message Saturday','Send anonymous compliments, confessions, encouragement or appreciation. Remain respectful.'),
  (0,'Sunday Best','Share your outfit. Evening group call.')
ON CONFLICT (day) DO NOTHING;

-- WINNERS
CREATE TABLE IF NOT EXISTS public.winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity text NOT NULL,
  winner_name text NOT NULL,
  winner_image text,
  congratulation_message text,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.winners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.winners TO authenticated;
GRANT ALL ON public.winners TO service_role;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners are public" ON public.winners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert winners" ON public.winners FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update winners" ON public.winners FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete winners" ON public.winners FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ANNOUNCEMENTS extras
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publish_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS activities_updated_at ON public.activities;
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS winners_updated_at ON public.winners;
CREATE TRIGGER winners_updated_at BEFORE UPDATE ON public.winners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS members_updated_at ON public.members;
CREATE TRIGGER members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.winners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;