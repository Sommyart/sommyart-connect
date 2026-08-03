-- 1. Drop legacy AWKA CONNECT tables
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.business_posts CASCADE;
DROP TABLE IF EXISTS public.member_points CASCADE;
DROP TABLE IF EXISTS public.member_badges CASCADE;
DROP TABLE IF EXISTS public.points_ledger CASCADE;
DROP TABLE IF EXISTS public.daily_completions CASCADE;
DROP TABLE IF EXISTS public.member_sessions CASCADE;
DROP TABLE IF EXISTS public.whatsapp_consents CASCADE;
DROP TABLE IF EXISTS public.winners CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.riddles CASCADE;

-- 2. Drop legacy functions
DROP FUNCTION IF EXISTS public.sync_member_public_data() CASCADE;
DROP FUNCTION IF EXISTS public.claim_first_admin() CASCADE;

-- 3. Remove legacy storage bucket and its permissive policies
DROP POLICY IF EXISTS "Anyone can upload a profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are viewable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete profile pictures" ON storage.objects;

-- 4. Tighten media bucket reads to signed-in users (signed URLs still work)
DROP POLICY IF EXISTS "Media readable by anyone" ON storage.objects;
CREATE POLICY "Media readable by members"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media');

-- 5. Grant admin automatically to the designated SOMMYART CONNECT admins
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

  IF lower(coalesce(NEW.email,'')) IN ('josiahbenmoshe@gmail.com','janedan732@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. handle_new_user is trigger-only; no direct execution from API roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;