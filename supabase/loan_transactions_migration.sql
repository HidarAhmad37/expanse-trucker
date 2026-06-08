-- Links loan repayments to transactions (optional but recommended)
-- Run in Supabase SQL Editor

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_loan ON public.transactions(loan_id);
