-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

-- Create new policy allowing users with accounting/executive/admin roles to view all profiles
CREATE POLICY "Authorized users can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR 
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);