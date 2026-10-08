ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS last_delivered_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👍','❤️','😂','🔥','👏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX message_reactions_conv_idx ON public.message_reactions(conversation_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read reactions" ON public.message_reactions FOR SELECT TO authenticated
  USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants add own reactions" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_participant(conversation_id, auth.uid())
    AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.conversation_id = message_reactions.conversation_id));
CREATE POLICY "Users change own reactions" ON public.message_reactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "Users remove own reactions" ON public.message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

CREATE OR REPLACE FUNCTION public.mark_messages_delivered()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE conversation_participants SET last_delivered_at = now() WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.mark_messages_delivered() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_delivered() TO authenticated;

CREATE OR REPLACE FUNCTION public.search_members(_q text)
RETURNS TABLE(id uuid, username text, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.username, p.full_name, p.avatar_url FROM profiles p
  WHERE auth.uid() IS NOT NULL AND p.id <> auth.uid() AND NOT p.deactivated AND NOT p.suspended
    AND NOT is_blocked_between(auth.uid(), p.id)
    AND (coalesce(_q,'') = '' OR p.full_name ILIKE '%' || _q || '%' OR p.username ILIKE '%' || _q || '%')
  ORDER BY p.full_name LIMIT 30;
$$;
REVOKE ALL ON FUNCTION public.search_members(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_members(text) TO authenticated;