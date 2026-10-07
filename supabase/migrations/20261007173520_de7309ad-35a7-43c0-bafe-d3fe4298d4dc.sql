CREATE OR REPLACE FUNCTION public.on_project_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_name text; f record;
BEGIN
  SELECT full_name INTO actor_name FROM profiles WHERE id = NEW.owner_id;
  FOR f IN SELECT follower_id FROM follows WHERE following_id = NEW.owner_id LOOP
    PERFORM notify_user(f.follower_id, 'project', coalesce(actor_name,'A creator') || ' published a new project', left(NEW.title,120), '/projects/' || NEW.id);
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.on_project_created() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS projects_notify_followers ON public.projects;
CREATE TRIGGER projects_notify_followers AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.on_project_created();