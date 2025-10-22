-- Fix Critical Security Issues: Financial Data and Storage Access Control

-- ============================================================================
-- 1. DROP OVERLY PERMISSIVE RLS POLICIES ON FINANCIAL TABLES
-- ============================================================================

-- Drop existing permissive policies on financial tables
DROP POLICY IF EXISTS "Allow all operations on transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all operations on expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow all operations on income_categories" ON public.income_categories;
DROP POLICY IF EXISTS "Allow all operations on expense_items" ON public.expense_items;
DROP POLICY IF EXISTS "Allow all operations on income_items" ON public.income_items;
DROP POLICY IF EXISTS "Allow all operations on transaction_attachments" ON public.transaction_attachments;

-- ============================================================================
-- 2. CREATE SECURE RLS POLICIES FOR FINANCIAL TABLES (AUTHENTICATED USERS ONLY)
-- ============================================================================

-- Transactions table - Only authenticated users with financial roles
CREATE POLICY "Authorized users can view transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Authorized users can insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Authorized users can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Authorized users can delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'แอดมิน'::app_role)
);

-- Expense Categories - Only authenticated users
CREATE POLICY "Authorized users can view expense categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can manage expense categories"
ON public.expense_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'แอดมิน'::app_role))
WITH CHECK (has_role(auth.uid(), 'แอดมิน'::app_role));

-- Income Categories - Only authenticated users
CREATE POLICY "Authorized users can view income categories"
ON public.income_categories FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can manage income categories"
ON public.income_categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'แอดมิน'::app_role))
WITH CHECK (has_role(auth.uid(), 'แอดมิน'::app_role));

-- Expense Items - Only authenticated users
CREATE POLICY "Authorized users can view expense items"
ON public.expense_items FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can manage expense items"
ON public.expense_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'แอดมิน'::app_role))
WITH CHECK (has_role(auth.uid(), 'แอดมิน'::app_role));

-- Income Items - Only authenticated users
CREATE POLICY "Authorized users can view income items"
ON public.income_items FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can manage income items"
ON public.income_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'แอดมิน'::app_role))
WITH CHECK (has_role(auth.uid(), 'แอดมิน'::app_role));

-- Transaction Attachments - Only authenticated users
CREATE POLICY "Authorized users can view transaction attachments"
ON public.transaction_attachments FOR SELECT
TO authenticated
USING (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Authorized users can insert transaction attachments"
ON public.transaction_attachments FOR INSERT
TO authenticated
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can manage transaction attachments"
ON public.transaction_attachments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'แอดมิน'::app_role))
WITH CHECK (has_role(auth.uid(), 'แอดมิน'::app_role));

-- ============================================================================
-- 3. FIX STORAGE BUCKET POLICIES FOR TRANSACTION ATTACHMENTS
-- ============================================================================

-- Drop existing overly permissive storage policy
DROP POLICY IF EXISTS "Allow all operations on transaction attachments storage" ON storage.objects;

-- Create secure storage policies for authenticated users with appropriate roles
CREATE POLICY "Authorized users can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'transaction-attachments' AND
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'ผู้บริหาร'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Authorized users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transaction-attachments' AND
  has_any_role(auth.uid(), ARRAY['บัญชี'::app_role, 'แอดมิน'::app_role])
);

CREATE POLICY "Admins can update attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'transaction-attachments' AND
  has_role(auth.uid(), 'แอดมิน'::app_role)
);

CREATE POLICY "Admins can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'transaction-attachments' AND
  has_role(auth.uid(), 'แอดมิน'::app_role)
);

-- ============================================================================
-- 4. RESTRICT PROFILES TABLE ACCESS
-- ============================================================================

-- Drop existing overly permissive profile policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy that allows users to view only their own profile or admins can view all
CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'แอดมิน'::app_role)
);

-- ============================================================================
-- 5. FIX FUNCTION SEARCH PATH (Supabase Linter Issue)
-- ============================================================================

-- Update update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;