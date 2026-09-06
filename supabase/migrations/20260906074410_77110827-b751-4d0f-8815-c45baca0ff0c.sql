CREATE OR REPLACE FUNCTION public.sync_my_admin_role()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); mail text; listed boolean;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT lower(email) INTO mail FROM auth.users WHERE id = uid;
  listed := EXISTS (
    SELECT 1
    FROM public.admin_emails
    WHERE lower(email) IN (
      'adannachikaodi6@gmail.com',
      'josiahbenmoshe@gmail.com',
      'twinklegoodluck@gmail.com'
    )
    AND lower(email) = mail
  );
  IF listed THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = uid AND role = 'admin';
  END IF;
  RETURN listed;
END; $function$;

DROP POLICY IF EXISTS "Users can read admin roles" ON public.user_roles;
CREATE POLICY "Users can read admin roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'admin');

DELETE FROM public.admin_emails
WHERE lower(email) NOT IN (
  'adannachikaodi6@gmail.com',
  'josiahbenmoshe@gmail.com',
  'twinklegoodluck@gmail.com'
);

INSERT INTO public.admin_emails (email, is_super)
VALUES
  ('adannachikaodi6@gmail.com', true),
  ('josiahbenmoshe@gmail.com', true),
  ('twinklegoodluck@gmail.com', true)
ON CONFLICT (email) DO UPDATE SET is_super = EXCLUDED.is_super;

DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT id FROM auth.users
    WHERE lower(email) NOT IN (
      'adannachikaodi6@gmail.com',
      'josiahbenmoshe@gmail.com',
      'twinklegoodluck@gmail.com'
    )
  );

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN (
  'adannachikaodi6@gmail.com',
  'josiahbenmoshe@gmail.com',
  'twinklegoodluck@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.game_scores WHERE lower(game) = 'crossword';