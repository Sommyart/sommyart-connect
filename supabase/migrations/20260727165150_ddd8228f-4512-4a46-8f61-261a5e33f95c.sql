CREATE POLICY "Anyone can upload a profile picture" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'profile-pictures');

CREATE POLICY "Profile pictures are viewable" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-pictures');

CREATE POLICY "Admins can delete profile pictures" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'profile-pictures' AND public.has_role(auth.uid(),'admin'));