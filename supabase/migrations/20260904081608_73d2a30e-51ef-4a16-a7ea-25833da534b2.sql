-- 1. Permanent administrator email registry
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  is_super boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin emails" ON public.admin_emails
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins manage admin emails" ON public.admin_emails
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_emails ae WHERE lower(ae.email) = lower(auth.jwt() ->> 'email') AND ae.is_super))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_emails ae WHERE lower(ae.email) = lower(auth.jwt() ->> 'email') AND ae.is_super));

INSERT INTO public.admin_emails (email, is_super) VALUES
  ('adannachikaodi6@gmail.com', true),
  ('josiahbenmoshe@gmail.com', true),
  ('twinklegoodluck@gmail.com', true)
ON CONFLICT (email) DO UPDATE SET is_super = true;

-- 2. Admin roles are publicly visible so the Admin badge can render anywhere
DROP POLICY IF EXISTS "Signed in members can see admin roles" ON public.user_roles;
CREATE POLICY "Signed in members can see admin roles" ON public.user_roles
  FOR SELECT TO authenticated USING (role = 'admin');

-- 3. Self-service role sync: grants admin only when the caller's own verified
-- email is in the registry, and revokes it the moment it is removed.
CREATE OR REPLACE FUNCTION public.sync_my_admin_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); mail text; listed boolean;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT lower(email) INTO mail FROM auth.users WHERE id = uid;
  listed := EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = mail);
  IF listed THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = uid AND role = 'admin';
  END IF;
  RETURN listed;
END; $$;

REVOKE ALL ON FUNCTION public.sync_my_admin_role() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sync_my_admin_role() TO authenticated;

-- 4. New sign-ups matching the registry become administrators automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(coalesce(NEW.email,''))) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $function$;

-- 5. Reconcile existing accounts against the registry (keeps all their data)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u
JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
    WHERE u.id = ur.user_id
  );

-- 6. Crossword game retired
DELETE FROM public.game_scores WHERE game = 'crossword';