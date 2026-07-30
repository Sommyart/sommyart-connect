
UPDATE public.activities SET title = 'Business Spotlight Tuesday', description = 'Advertise your business — share up to 3 photos of what you do. Posting opens on Tuesdays only.' WHERE day = 2;
UPDATE public.activities SET title = 'Best Outfit Sunday', description = 'Show off your best outfit of the week, then join the community group call in the evening.' WHERE day = 0;

ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.business_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  member_nickname text NOT NULL,
  member_image text,
  business_name text,
  caption text,
  images text[] NOT NULL CHECK (array_length(images, 1) BETWEEN 1 AND 3),
  post_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Lagos')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_posts TO anon;
GRANT SELECT ON public.business_posts TO authenticated;
GRANT ALL ON public.business_posts TO service_role;

ALTER TABLE public.business_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business posts are public" ON public.business_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins delete business posts" ON public.business_posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update business posts" ON public.business_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_business_posts_updated_at BEFORE UPDATE ON public.business_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_member_public_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.winners
     SET winner_name = NEW.nickname,
         winner_image = NEW.profile_picture,
         updated_at = now()
   WHERE member_id = NEW.id;

  UPDATE public.business_posts
     SET member_nickname = NEW.nickname,
         member_image = NEW.profile_picture,
         updated_at = now()
   WHERE member_id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_member_public_data_trigger
AFTER UPDATE OF nickname, profile_picture ON public.members
FOR EACH ROW EXECUTE FUNCTION public.sync_member_public_data();

ALTER PUBLICATION supabase_realtime ADD TABLE public.business_posts;
