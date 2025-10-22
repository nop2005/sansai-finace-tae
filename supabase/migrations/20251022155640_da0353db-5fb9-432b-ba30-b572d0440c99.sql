-- Update handle_new_user function to auto-generate username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with auto-generated username from email (part before @)
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1), -- Auto-generate username from email
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Assign default role (ผู้ใช้ทั่วไป)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ผู้ใช้ทั่วไป');
  
  RETURN NEW;
END;
$$;