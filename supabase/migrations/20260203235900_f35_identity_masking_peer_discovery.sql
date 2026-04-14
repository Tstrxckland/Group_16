-- F3.5: Implement identity masking logic for peer discovery
-- Provides a backend-safe view that masks identifying profile fields
-- whenever a user has anonymity enabled.

CREATE OR REPLACE VIEW public.peer_discovery_profiles
WITH (security_invoker = on)
AS
SELECT
  p.id,
  p.user_id,
  p.username,
  p.is_anonymous,
  CASE
    WHEN p.is_anonymous THEN 'Anonymous User'
    ELSE COALESCE(NULLIF(TRIM(p.display_name), ''), NULLIF(TRIM(p.username), ''), 'User')
  END AS public_display_name,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE p.avatar_url
  END AS public_avatar_url,
  CASE
    WHEN p.is_anonymous THEN NULL
    ELSE p.display_name
  END AS public_raw_display_name,
  p.created_at
FROM public.profiles p;

COMMENT ON VIEW public.peer_discovery_profiles IS
'Identity-safe peer discovery surface. Use this view for matching/filtering to avoid exposing real names or photos when anonymity is enabled.';

GRANT SELECT ON public.peer_discovery_profiles TO authenticated;
