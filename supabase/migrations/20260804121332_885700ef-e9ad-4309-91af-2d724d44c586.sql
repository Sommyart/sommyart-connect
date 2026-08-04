ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS notify_announcements boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_mentions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated boolean NOT NULL DEFAULT false;