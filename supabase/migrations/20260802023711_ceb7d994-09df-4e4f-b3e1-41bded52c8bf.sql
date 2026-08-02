-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  username text NOT NULL,
  email text,
  phone text,
  occupation text,
  bio text,
  avatar_url text,
  points integer NOT NULL DEFAULT 0,
  weekly_points integer NOT NULL DEFAULT 0,
  monthly_points integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  suspended boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)), '[^a-z0-9_]', '', 'g'));
  IF base = '' OR base IS NULL THEN base := 'member'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
    n := n + 1; candidate := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, full_name, username, email, phone, occupation, bio, avatar_url)
  VALUES (NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    candidate,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'occupation',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ FOLLOWS ============
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- ============ FEED ============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  media_type text NOT NULL DEFAULT 'none',
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins delete posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are public" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins delete comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated;
GRANT SELECT ON public.post_reactions TO anon;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are public" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users react" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users change reaction" ON public.post_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove reaction" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own saves" ON public.post_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users save posts" ON public.post_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave posts" ON public.post_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  media_urls text[] NOT NULL DEFAULT '{}',
  link_url text,
  download_url text,
  technologies text[] NOT NULL DEFAULT '{}',
  views integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are public" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins update projects" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners or admins delete projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_likes TO authenticated;
GRANT SELECT ON public.project_likes TO anon;
GRANT ALL ON public.project_likes TO service_role;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project likes are public" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Users like projects" ON public.project_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike projects" ON public.project_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_comments TO authenticated;
GRANT SELECT ON public.project_comments TO anon;
GRANT ALL ON public.project_comments TO service_role;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project comments are public" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Users comment projects" ON public.project_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors or admins delete project comments" ON public.project_comments FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

-- ============ CHALLENGES + SUBMISSIONS ============
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'weekly',
  day_of_week smallint,
  track text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  prompt text,
  ai_tool text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are public" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Admins insert challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update challenges" ON public.challenges FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete challenges" ON public.challenges FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
  track text NOT NULL DEFAULT 'general',
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  link_url text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT SELECT ON public.submissions TO anon;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submissions are public" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Users submit" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update submissions" ON public.submissions FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Admins update submissions" ON public.submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authors or admins delete submissions" ON public.submissions FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.submission_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked text NOT NULL,
  improvement text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, author_id)
);
GRANT SELECT, INSERT, DELETE ON public.submission_feedback TO authenticated;
GRANT SELECT ON public.submission_feedback TO anon;
GRANT ALL ON public.submission_feedback TO service_role;
ALTER TABLE public.submission_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feedback is public" ON public.submission_feedback FOR SELECT USING (true);
CREATE POLICY "Users give feedback" ON public.submission_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND length(btrim(liked)) >= 10 AND length(btrim(improvement)) >= 10);
CREATE POLICY "Authors or admins delete feedback" ON public.submission_feedback FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voter_id, challenge_id, category)
);
GRANT SELECT, INSERT, DELETE ON public.votes TO authenticated;
GRANT SELECT ON public.votes TO anon;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes are public" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users vote" ON public.votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users remove own vote" ON public.votes FOR DELETE TO authenticated USING (auth.uid() = voter_id);

-- ============ LESSONS + EVENTS ============
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  presenter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  presenter_name text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL DEFAULT 10,
  meeting_url text,
  recording_url text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are public" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Members propose lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (auth.uid() = presenter_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Presenter or admin updates lesson" ON public.lessons FOR UPDATE TO authenticated USING (auth.uid() = presenter_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = presenter_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Presenter or admin deletes lesson" ON public.lessons FOR DELETE TO authenticated USING (auth.uid() = presenter_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lesson_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_rsvps TO authenticated;
GRANT SELECT ON public.lesson_rsvps TO anon;
GRANT ALL ON public.lesson_rsvps TO service_role;
ALTER TABLE public.lesson_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs are public" ON public.lesson_rsvps FOR SELECT USING (true);
CREATE POLICY "Users rsvp" ON public.lesson_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel rsvp" ON public.lesson_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'monthly',
  week_of_month smallint,
  speaker_name text,
  speaker_title text,
  speaker_image text,
  starts_at timestamptz,
  cover_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete events" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POINTS + REWARDS ============
CREATE TABLE public.points_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  reason text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_log TO authenticated;
GRANT ALL ON public.points_log TO service_role;
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own points log" ON public.points_log FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cost integer NOT NULL DEFAULT 100,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rewards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards are public" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Admins insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update rewards" ON public.rewards FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete rewards" ON public.rewards FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cost integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.redemptions TO authenticated;
GRANT UPDATE ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own redemptions" ON public.redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update redemptions" ON public.redemptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER redemptions_updated_at BEFORE UPDATE ON public.redemptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'general',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ SEED ============
INSERT INTO public.challenges (kind, day_of_week, track, title, description, prompt, is_active) VALUES
 ('weekly', 0, 'mission_sunday', 'Mission Sunday', 'Set one clear AI or tech goal for the week and find an accountability partner.', 'What''s one AI or tech project you''ll complete this week?', true),
 ('weekly', 1, 'ai_tool_challenge', 'AI Tool Challenge', 'The admin introduces one AI tool. You have 24 hours to build something with it.', 'Build something with this week''s featured AI tool.', true),
 ('weekly', 2, 'tech_challenge_tuesday', 'Tech Challenge Tuesday', 'Everyone receives the same challenge — landing pages, AI logos, chatbots, prompts, automations, portfolios.', 'Complete today''s community-wide tech challenge.', true),
 ('weekly', 3, 'wip_wednesday', 'Work-in-Progress Wednesday', 'Share what you are building. Review at least two projects to earn participation points.', 'Share your work in progress and review two others.', true),
 ('weekly', 4, 'knowledge_exchange', 'Knowledge Exchange', 'Community teaching day — host a 5–10 minute lesson or RSVP to attend one.', 'Teach or learn something new today.', true),
 ('weekly', 5, 'demo_day', 'Demo Day', 'Showcase completed work and vote across four community categories.', 'Show what you finished this week.', true);

INSERT INTO public.events (title, description, kind, week_of_month) VALUES
 ('AI Prompt Battle', 'Head-to-head prompt engineering showdown.', 'monthly', 1),
 ('48-Hour Build Challenge', 'Ship a working product in 48 hours.', 'monthly', 2),
 ('Community Hackathon', 'Team up and build something ambitious.', 'monthly', 3),
 ('Guest Speaker Session', 'AI founders, designers, developers and creators share their journey.', 'monthly', 4);

INSERT INTO public.rewards (title, description, cost, icon) VALUES
 ('Premium Prompt Pack', 'A curated pack of high-performing prompts.', 200, 'sparkles'),
 ('AI Resource Bundle', 'Templates, guides and tool credits.', 300, 'library'),
 ('One-on-One Mentoring', '30 minutes with a community mentor.', 600, 'users'),
 ('Community Badge', 'A permanent badge on your profile.', 150, 'badge'),
 ('Featured Member Spotlight', 'Front-page spotlight for a week.', 800, 'star'),
 ('Exclusive Workshop Seat', 'Reserved seat at a members-only workshop.', 500, 'graduation-cap');