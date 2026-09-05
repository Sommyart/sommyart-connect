REVOKE ALL ON FUNCTION public.notify_mentions(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_user(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_comment_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_follow_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_post_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_reaction_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_my_admin_role() FROM PUBLIC, anon, authenticated;