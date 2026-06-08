-- Expense Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#6366f1',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'AFN',
  exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Loans table (money you borrowed or lent to others)
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrowed', 'lent')),
  person_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  amount_repaid DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount_repaid >= 0),
  currency TEXT NOT NULL DEFAULT 'AFN',
  exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (amount_repaid <= amount)
);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES loans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_loan ON transactions(loan_id);

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  currency TEXT DEFAULT 'AFN',
  monthly_income DECIMAL(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_type ON loans(user_id, type);

-- Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Loans policies
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Users can insert own loans" ON loans;
DROP POLICY IF EXISTS "Users can update own loans" ON loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON loans;
CREATE POLICY "Users can view own loans" ON loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON loans FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Enforce that related rows belong to the same user
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

-- Profile + categories are created by the Vue app after signup (see src/lib/setupNewUser.ts)
-- Do NOT add auth.users triggers — they cause "Database error saving new user" on many projects.
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.seed_default_categories();
DROP FUNCTION IF EXISTS public.handle_new_user();
