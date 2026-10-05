ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS message_privacy text NOT NULL DEFAULT 'everyone';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_sender_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  muted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX ON public.conversation_participants(user_id);
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  media_urls text[] NOT NULL DEFAULT '{}',
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'text',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(conversation_id, created_at DESC);
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  topic text NOT NULL,
  message text NOT NULL DEFAULT '',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_reports TO authenticated;
GRANT SELECT, INSERT ON public.collaboration_requests TO authenticated;
GRANT ALL ON public.conversations, public.conversation_participants, public.messages, public.blocked_users, public.user_reports, public.collaboration_requests TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_participant(_conv uuid, _uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = _conv AND user_id = _uid)
$$;
CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM blocked_users WHERE (blocker_id=_a AND blocked_id=_b) OR (blocker_id=_b AND blocked_id=_a))
$$;
GRANT EXECUTE ON FUNCTION public.is_participant(uuid,uuid), public.is_blocked_between(uuid,uuid) TO authenticated;

CREATE POLICY "participants read conversations" ON public.conversations FOR SELECT TO authenticated USING (public.is_participant(id, auth.uid()));
CREATE POLICY "participants read members" ON public.conversation_participants FOR SELECT TO authenticated USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "update own participant row" ON public.conversation_participants FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND public.is_participant(conversation_id, auth.uid())
  AND NOT EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = messages.conversation_id AND p.user_id <> auth.uid() AND public.is_blocked_between(p.user_id, auth.uid()))
);
CREATE POLICY "edit own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "own blocks read" ON public.blocked_users FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "own blocks insert" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid() AND blocked_id <> auth.uid());
CREATE POLICY "own blocks delete" ON public.blocked_users FOR DELETE TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "report insert" ON public.user_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "report read" ON public.user_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "report admin update" ON public.user_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "collab read" ON public.collaboration_requests FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "collab insert" ON public.collaboration_requests FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid() AND NOT public.is_blocked_between(sender_id, recipient_id));

CREATE OR REPLACE FUNCTION public.ensure_conversation(_a uuid, _b uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  SELECT p1.conversation_id INTO _id FROM conversation_participants p1
    JOIN conversation_participants p2 ON p2.conversation_id = p1.conversation_id AND p2.user_id = _b
    WHERE p1.user_id = _a LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO _id;
    INSERT INTO conversation_participants(conversation_id, user_id) VALUES (_id,_a),(_id,_b);
  END IF;
  UPDATE conversation_participants SET deleted_at = NULL WHERE conversation_id = _id AND user_id = _a;
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_conversation(uuid,uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_conversation(_other uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid := auth.uid(); _priv text; _exists boolean;
BEGIN
  IF _me IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _other = _me THEN RAISE EXCEPTION 'You cannot message yourself'; END IF;
  IF is_blocked_between(_me,_other) THEN RAISE EXCEPTION 'This member is not accepting messages'; END IF;
  SELECT EXISTS (SELECT 1 FROM conversation_participants p1 JOIN conversation_participants p2 ON p2.conversation_id=p1.conversation_id AND p2.user_id=_other WHERE p1.user_id=_me) INTO _exists;
  IF NOT _exists THEN
    SELECT message_privacy INTO _priv FROM profiles WHERE id = _other;
    IF _priv IS NULL THEN RAISE EXCEPTION 'Member not found'; END IF;
    IF _priv = 'nobody' OR (_priv = 'favorites' AND NOT EXISTS (SELECT 1 FROM follows WHERE follower_id=_other AND following_id=_me)) THEN
      RAISE EXCEPTION 'This member is not accepting messages';
    END IF;
  END IF;
  RETURN ensure_conversation(_me,_other);
END $$;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.on_message_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; _name text;
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at, last_sender_id = NEW.sender_id, updated_at = now(),
    last_message_preview = CASE WHEN NEW.body <> '' THEN left(NEW.body, 140) WHEN array_length(NEW.media_urls,1) > 0 THEN 'Photo' ELSE '' END
    WHERE id = NEW.conversation_id;
  UPDATE conversation_participants SET last_read_at = NEW.created_at WHERE conversation_id = NEW.conversation_id AND user_id = NEW.sender_id;
  UPDATE conversation_participants SET deleted_at = NULL WHERE conversation_id = NEW.conversation_id;
  IF NEW.kind = 'system' THEN RETURN NEW; END IF;
  SELECT coalesce(nullif(username,''), full_name) INTO _name FROM profiles WHERE id = NEW.sender_id;
  FOR r IN SELECT user_id FROM conversation_participants WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id AND NOT muted LOOP
    DELETE FROM notifications WHERE user_id = r.user_id AND kind = 'message' AND link = '/messages/' || NEW.conversation_id AND NOT is_read;
    PERFORM notify_user(r.user_id, 'message', _name || ' sent you a message', left(coalesce(nullif(NEW.body,''),'Photo'),120), '/messages/' || NEW.conversation_id);
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.on_message_created();

CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conv uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE conversation_participants SET last_read_at = now() WHERE conversation_id = _conv AND user_id = auth.uid();
  UPDATE notifications SET is_read = true WHERE user_id = auth.uid() AND link = '/messages/' || _conv AND NOT is_read;
END $$;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_unread_counts() RETURNS TABLE(conversation_id uuid, unread bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.conversation_id, count(m.id)
  FROM conversation_participants p
  JOIN messages m ON m.conversation_id = p.conversation_id AND m.created_at > p.last_read_at AND m.sender_id <> p.user_id AND m.deleted_at IS NULL
  WHERE p.user_id = auth.uid() AND p.deleted_at IS NULL
  GROUP BY p.conversation_id
$$;
GRANT EXECUTE ON FUNCTION public.my_unread_counts() TO authenticated;

CREATE OR REPLACE FUNCTION public.on_collab_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  SELECT coalesce(nullif(username,''), full_name) INTO _name FROM profiles WHERE id = NEW.sender_id;
  PERFORM notify_user(NEW.recipient_id, 'collab_request', _name || ' sent you a collaboration request', left(NEW.topic,120), '/messages?collab=' || NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER collab_after_insert AFTER INSERT ON public.collaboration_requests FOR EACH ROW EXECUTE FUNCTION public.on_collab_created();

CREATE OR REPLACE FUNCTION public.respond_collaboration(_id uuid, _accept boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r collaboration_requests; _conv uuid; _name text;
BEGIN
  SELECT * INTO r FROM collaboration_requests WHERE id = _id AND recipient_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  SELECT coalesce(nullif(username,''), full_name) INTO _name FROM profiles WHERE id = r.recipient_id;
  IF _accept THEN
    _conv := ensure_conversation(r.recipient_id, r.sender_id);
    UPDATE collaboration_requests SET status='accepted', conversation_id=_conv, updated_at=now() WHERE id=_id;
    INSERT INTO messages(conversation_id, sender_id, body, kind) VALUES (_conv, r.recipient_id, 'Collaboration started: ' || r.topic, 'system');
    PERFORM notify_user(r.sender_id, 'collab_accepted', _name || ' accepted your collaboration request', left(r.topic,120), '/messages/' || _conv);
  ELSE
    UPDATE collaboration_requests SET status='declined', updated_at=now() WHERE id=_id;
    PERFORM notify_user(r.sender_id, 'collab_declined', _name || ' declined your collaboration request', left(r.topic,120), '/u/' || (SELECT username FROM profiles WHERE id=r.recipient_id));
  END IF;
  RETURN _conv;
END $$;
GRANT EXECUTE ON FUNCTION public.respond_collaboration(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_messaging_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN jsonb_build_object(
    'conversations', (SELECT count(*) FROM conversations),
    'messages_today', (SELECT count(*) FROM messages WHERE created_at > now() - interval '1 day'),
    'active_today', (SELECT count(DISTINCT sender_id) FROM messages WHERE created_at > now() - interval '1 day'),
    'collab_pending', (SELECT count(*) FROM collaboration_requests WHERE status='pending'),
    'collab_total', (SELECT count(*) FROM collaboration_requests),
    'reports_open', (SELECT count(*) FROM user_reports WHERE status='open'),
    'daily', (SELECT coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'count', (SELECT count(*) FROM messages WHERE created_at::date = d::date)) ORDER BY d), '[]'::jsonb)
              FROM generate_series(current_date - 6, current_date, interval '1 day') d)
  );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_messaging_stats() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

CREATE POLICY "dm media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'dm-media' AND public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "dm media upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dm-media' AND public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid()));