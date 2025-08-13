-- Migration script to switch from Spotify to Twitch authentication
-- To use this file, navigate to the "SQL Editor" in your Supabase project dashboard,
-- paste the content of this file, and click "Run".

-- Step 1: Rename the spotify_id column to twitch_id
ALTER TABLE public.users RENAME COLUMN spotify_id TO twitch_id;

-- Step 2: Drop the now-unused spotify_id unique constraint
-- Note: The constraint name might be different in your setup.
-- You can find the correct name in Supabase under "Database" -> "Tables" -> "users" -> "Constraints".
-- If the name is different, please update the command below.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_spotify_id_key;

-- Step 3: Add a new unique constraint for twitch_id
ALTER TABLE public.users ADD CONSTRAINT users_twitch_id_key UNIQUE (twitch_id);

-- Step 4: Drop the premium_status column
ALTER TABLE public.users DROP COLUMN IF EXISTS premium_status;

-- IMPORTANT:
-- After running this migration, all existing users created via Spotify will no longer be able to log in.
-- Their IDs have been preserved, but they will need to create new accounts using Twitch authentication.
-- This script is intended for use in development or before launching to real users.
-- If you have live users, a more complex data migration strategy would be needed.
