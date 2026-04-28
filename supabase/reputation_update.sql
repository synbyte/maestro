-- UPDATE REPUTATION FUNCTION TO INCLUDE NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.increment_reputation(profile_id uuid, amount int, reason text DEFAULT 'for being awesome')
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET reputation = reputation + amount
  WHERE id = profile_id;
  
  INSERT INTO public.notifications (user_id, type, title, content)
  VALUES (profile_id, 'reputation', 'Reputation Earned!', 'You earned ' || amount || ' points ' || reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
