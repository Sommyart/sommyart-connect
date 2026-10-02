CREATE OR REPLACE FUNCTION public.notify_mentions(_text text, _actor uuid, _link text, _context text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE handle text; actor_name text; target uuid; r record;
BEGIN
  SELECT full_name INTO actor_name FROM public.profiles WHERE id = _actor;
  IF coalesce(_text,'') ~* '(^|\s)@(all|everyone)\b' AND public.has_role(_actor, 'admin') THEN
    FOR r IN SELECT id FROM public.profiles WHERE id <> _actor AND NOT deactivated LOOP
      PERFORM public.notify_user(r.id, 'mention', coalesce(actor_name,'An admin') || ' tagged everyone', _context, _link);
    END LOOP;
  END IF;
  FOR handle IN SELECT DISTINCT lower(m[1]) FROM regexp_matches(coalesce(_text,''), '@([A-Za-z0-9_\.]{2,30})', 'g') AS m LOOP
    IF handle IN ('all','everyone') THEN CONTINUE; END IF;
    SELECT id INTO target FROM public.profiles WHERE lower(username) = handle LIMIT 1;
    IF target IS NOT NULL AND target <> _actor THEN
      PERFORM public.notify_user(target, 'mention', coalesce(actor_name,'Someone') || ' mentioned you', _context, _link);
    END IF;
  END LOOP;
END; $function$;

CREATE OR REPLACE FUNCTION public.on_post_updated()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content AND coalesce(NEW.content,'') ~* '(^|\s)@(all|everyone)\b'
     AND NOT coalesce(OLD.content,'') ~* '(^|\s)@(all|everyone)\b' AND public.has_role(NEW.author_id,'admin') THEN
    PERFORM public.notify_mentions('@all', NEW.author_id, '/feed#' || NEW.id, left(coalesce(NEW.content,''),120));
  END IF;
  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.on_post_updated() FROM public, anon, authenticated;
CREATE TRIGGER trg_post_updated AFTER UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.on_post_updated();