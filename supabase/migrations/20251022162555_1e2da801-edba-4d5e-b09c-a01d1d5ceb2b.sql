-- Update trigger to not assign role for self-registered users
-- This allows admin to assign roles manually
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for all users
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  
  -- Do NOT assign any role by default
  -- Admin will assign role manually
  
  RETURN new;
END;
$$;