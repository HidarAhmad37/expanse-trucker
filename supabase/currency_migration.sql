-- Multi-currency support (base currency: AFN)
-- Run in Supabase SQL Editor

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AFN',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0);

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'AFN',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0);

UPDATE public.transactions SET currency = 'AFN', exchange_rate = 1 WHERE currency IS NULL;
UPDATE public.loans SET currency = 'AFN', exchange_rate = 1 WHERE currency IS NULL;
