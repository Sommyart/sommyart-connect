DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('announcements','Announcements are public'),('posts','Posts are public'),('profiles','Profiles are public'),
    ('follows','Follows are public'),('post_comments','Comments are public'),('post_reactions','Reactions are public'),
    ('projects','Projects are public'),('project_likes','Project likes are public'),('project_comments','Project comments are public'),
    ('challenges','Challenges are public'),('submissions','Submissions are public'),('submission_feedback','Feedback is public'),
    ('lesson_rsvps','RSVPs are public'),('votes','Votes are public'),('lessons','Lessons are public'),
    ('events','Events are public'),('rewards','Rewards are public'),('game_scores','scores_select_all')) v(t,p)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.p, r.t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', 'Members can read ' || r.t, r.t);
  END LOOP;
END $$;