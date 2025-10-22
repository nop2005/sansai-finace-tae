-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('ผู้ใช้ทั่วไป', 'บัญชี', 'ผู้บริหาร', 'แอดมิน');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create menu_permissions table
CREATE TABLE public.menu_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  menu_path TEXT NOT NULL,
  menu_name TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, menu_path)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any of the roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default role (ผู้ใช้ทั่วไป)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ผู้ใช้ทั่วไป');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'แอดมิน'))
  WITH CHECK (public.has_role(auth.uid(), 'แอดมิน'));

-- RLS Policies for menu_permissions
CREATE POLICY "Users can view menu permissions"
  ON public.menu_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage menu permissions"
  ON public.menu_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'แอดมิน'))
  WITH CHECK (public.has_role(auth.uid(), 'แอดมิน'));

-- Insert default menu permissions for all roles
INSERT INTO public.menu_permissions (role, menu_path, menu_name, can_access) VALUES
  -- Dashboard - all roles can access
  ('ผู้ใช้ทั่วไป', '/', 'หน้าหลัก', true),
  ('บัญชี', '/', 'หน้าหลัก', true),
  ('ผู้บริหาร', '/', 'หน้าหลัก', true),
  ('แอดมิน', '/', 'หน้าหลัก', true),
  
  -- Income - บัญชี, ผู้บริหาร, แอดมิน
  ('ผู้ใช้ทั่วไป', '/income', 'รายรับ', false),
  ('บัญชี', '/income', 'รายรับ', true),
  ('ผู้บริหาร', '/income', 'รายรับ', true),
  ('แอดมิน', '/income', 'รายรับ', true),
  
  -- Expense - บัญชี, ผู้บริหาร, แอดมิน
  ('ผู้ใช้ทั่วไป', '/expense', 'รายจ่าย', false),
  ('บัญชี', '/expense', 'รายจ่าย', true),
  ('ผู้บริหาร', '/expense', 'รายจ่าย', true),
  ('แอดมิน', '/expense', 'รายจ่าย', true),
  
  -- Transactions - บัญชี, ผู้บริหาร, แอดมิน
  ('ผู้ใช้ทั่วไป', '/transactions', 'รายการทั้งหมด', false),
  ('บัญชี', '/transactions', 'รายการทั้งหมด', true),
  ('ผู้บริหาร', '/transactions', 'รายการทั้งหมด', true),
  ('แอดมิน', '/transactions', 'รายการทั้งหมด', true),
  
  -- Reports - ผู้บริหาร, แอดมิน
  ('ผู้ใช้ทั่วไป', '/reports', 'รายงาน', false),
  ('บัญชี', '/reports', 'รายงาน', false),
  ('ผู้บริหาร', '/reports', 'รายงาน', true),
  ('แอดมิน', '/reports', 'รายงาน', true),
  
  -- Settings - แอดมิน only
  ('ผู้ใช้ทั่วไป', '/settings', 'ตั้งค่า', false),
  ('บัญชี', '/settings', 'ตั้งค่า', false),
  ('ผู้บริหาร', '/settings', 'ตั้งค่า', false),
  ('แอดมิน', '/settings', 'ตั้งค่า', true),
  
  -- User Management - แอดมิน only
  ('ผู้ใช้ทั่วไป', '/user-management', 'จัดการผู้ใช้', false),
  ('บัญชี', '/user-management', 'จัดการผู้ใช้', false),
  ('ผู้บริหาร', '/user-management', 'จัดการผู้ใช้', false),
  ('แอดมิน', '/user-management', 'จัดการผู้ใช้', true),
  
  -- Permissions - แอดมิน only
  ('ผู้ใช้ทั่วไป', '/permissions', 'จัดการสิทธิ์', false),
  ('บัญชี', '/permissions', 'จัดการสิทธิ์', false),
  ('ผู้บริหาร', '/permissions', 'จัดการสิทธิ์', false),
  ('แอดมิน', '/permissions', 'จัดการสิทธิ์', true);

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_permissions_updated_at
  BEFORE UPDATE ON public.menu_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();