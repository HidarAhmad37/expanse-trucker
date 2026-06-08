-- Multi-user isolation: ensure every table is scoped per auth user.
-- Run this in Supabase SQL Editor if users can see each other's data.
-- Safe to run multiple times.

-- Backfill user_id is NOT possible without knowing ownership — new installs use schema.sql.
-- This script enables RLS and policies so each user only sees their own rows.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Profiles (id = auth user id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Loans
DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON public.loans;
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);

-- Prevent cross-user category references on budgets
CREATE OR REPLACE FUNCTION public.check_budget_category_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE id = NEW.category_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Budget category must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_budget_category_owner ON public.budgets;
CREATE TRIGGER ensure_budget_category_owner
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.check_budget_category_owner();

-- Prevent cross-user category/loan references on transactions
CREATE OR REPLACE FUNCTION public.check_transaction_refs_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE id = NEW.category_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Transaction category must belong to the same user';
  END IF;
  IF NEW.loan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.loans
    WHERE id = NEW.loan_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Transaction loan must belong to the same user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_transaction_refs_owner ON public.transactions;
CREATE TRIGGER ensure_transaction_refs_owner
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_transaction_refs_owner();
