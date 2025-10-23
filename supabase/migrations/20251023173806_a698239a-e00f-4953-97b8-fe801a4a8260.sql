-- Add created_by column to track who created the transaction
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);