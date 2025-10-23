-- Add edit tracking columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS edited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone;