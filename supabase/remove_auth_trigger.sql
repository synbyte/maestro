-- This script removes the automatic profile creation trigger.
-- This prevents "Unknown" profiles from being created before onboarding is complete.

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- After running this, profiles will only be created when a user completes the onboarding flow
-- in the application, which ensures they have a display name and other required fields.
