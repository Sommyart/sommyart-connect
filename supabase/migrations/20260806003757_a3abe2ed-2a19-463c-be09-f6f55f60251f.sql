
-- 1. Threaded replies
ALTER TABLE public.post_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON public.post_comments(parent_id);

-- 2. Quiz question bank
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy',
  question text NOT NULL,
  options jsonb NOT NULL,
  answer integer NOT NULL DEFAULT 0,
  explanation text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_read" ON public.quiz_questions;
CREATE POLICY "quiz_questions_read" ON public.quiz_questions FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "quiz_questions_admin_write" ON public.quiz_questions;
CREATE POLICY "quiz_questions_admin_write" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Notification helpers
CREATE OR REPLACE FUNCTION public.notify_user(_user_id uuid, _kind text, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (_user_id, _kind, _title, _body, _link);
END; $$;

CREATE OR REPLACE FUNCTION public.notify_mentions(_text text, _actor uuid, _link text, _context text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  handle text;
  actor_name text;
  target uuid;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = _actor;
  FOR handle IN SELECT DISTINCT lower(m[1]) FROM regexp_matches(coalesce(_text,''), '@([A-Za-z0-9_\.]{2,30})', 'g') AS m LOOP
    SELECT id INTO target FROM public.profiles WHERE lower(username) = handle LIMIT 1;
    IF target IS NOT NULL AND target <> _actor THEN
      PERFORM public.notify_user(target, 'mention', coalesce(actor_name,'Someone') || ' mentioned you', _context, _link);
    END IF;
  END LOOP;
END; $$;

-- new post: notify followers + mentions
CREATE OR REPLACE FUNCTION public.on_post_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; f record;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.author_id;
  FOR f IN SELECT follower_id FROM public.follows WHERE following_id = NEW.author_id LOOP
    PERFORM public.notify_user(f.follower_id, 'post', coalesce(actor_name,'A creator') || ' shared a new post',
      left(coalesce(NEW.content,''), 120), '/feed#' || NEW.id);
  END LOOP;
  PERFORM public.notify_mentions(NEW.content, NEW.author_id, '/feed#' || NEW.id, left(coalesce(NEW.content,''),120));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_post_created ON public.posts;
CREATE TRIGGER trg_post_created AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.on_post_created();

-- comment / reply
CREATE OR REPLACE FUNCTION public.on_comment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; post_author uuid; parent_author uuid;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.author_id;
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM public.post_comments WHERE id = NEW.parent_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.author_id THEN
      PERFORM public.notify_user(parent_author, 'reply', coalesce(actor_name,'Someone') || ' replied to you', left(NEW.body,120), '/feed#' || NEW.post_id);
    END IF;
  END IF;
  IF post_author IS NOT NULL AND post_author <> NEW.author_id AND post_author IS DISTINCT FROM parent_author THEN
    PERFORM public.notify_user(post_author, 'comment', coalesce(actor_name,'Someone') || ' commented on your post', left(NEW.body,120), '/feed#' || NEW.post_id);
  END IF;
  PERFORM public.notify_mentions(NEW.body, NEW.author_id, '/feed#' || NEW.post_id, left(NEW.body,120));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_comment_created ON public.post_comments;
CREATE TRIGGER trg_comment_created AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.on_comment_created();

-- like
CREATE OR REPLACE FUNCTION public.on_reaction_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; post_author uuid;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author <> NEW.user_id THEN
    PERFORM public.notify_user(post_author, 'like', coalesce(actor_name,'Someone') || ' liked your post', '', '/feed#' || NEW.post_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_reaction_created ON public.post_reactions;
CREATE TRIGGER trg_reaction_created AFTER INSERT ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.on_reaction_created();

-- new follower
CREATE OR REPLACE FUNCTION public.on_follow_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = NEW.follower_id;
  PERFORM public.notify_user(NEW.following_id, 'follow', coalesce(actor_name,'Someone') || ' favourited you', 'You have a new follower', '/feed');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_follow_created ON public.follows;
CREATE TRIGGER trg_follow_created AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.on_follow_created();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
