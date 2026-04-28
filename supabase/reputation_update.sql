-- UPDATE REPUTATION FUNCTION TO REMOVE NOTIFICATIONS (as requested)
CREATE OR REPLACE FUNCTION public.increment_reputation(profile_id uuid, amount int, reason text DEFAULT 'for being awesome')
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET reputation = reputation + amount
  WHERE id = profile_id;
  
  -- Notification block removed in favor of the new visual "pop" system
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
