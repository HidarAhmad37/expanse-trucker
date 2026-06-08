-- Run this in Supabase SQL Editor to add Loans feature

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrowed', 'lent')),
  person_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  amount_repaid DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount_repaid >= 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (amount_repaid <= amount)
);

CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_type ON public.loans(user_id, type);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON public.loans;

CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);
