-- Allow authenticated users to view profiles for social features like friend search
CREATE POLICY "Profiles are viewable for social features"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);