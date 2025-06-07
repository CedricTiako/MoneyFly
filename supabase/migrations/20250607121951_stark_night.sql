/*
  # Complete Database Schema for Personal Finance App

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, references auth.users)
      - `nom` (text, user's name)
      - `email` (text, unique)
      - `pays` (text, country, default 'Cameroun')
      - `devise` (text, currency, default 'FCFA')
      - `created_at`, `updated_at` (timestamps)

    - `budgets` - Monthly budget tracking
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `mois` (text, YYYY-MM format)
      - `revenu` (numeric, monthly income)
      - `total_depense` (numeric, total expenses)
      - `total_epargne` (numeric, total savings)
      - `created_at`, `updated_at` (timestamps)

    - `categories` - Expense categories
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `nom` (text, category name)
      - `couleur` (text, color for UI)
      - `icone` (text, icon identifier)
      - `budget_alloue` (numeric, allocated budget)
      - `created_at` (timestamp)

    - `depenses` - Individual expenses
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `budget_id` (uuid, references budgets)
      - `categorie_id` (uuid, references categories)
      - `montant` (numeric, expense amount)
      - `description` (text, expense description)
      - `date_depense` (date, expense date)
      - `created_at` (timestamp)

    - `objectifs` - Savings goals
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `titre` (text, goal title)
      - `description` (text, goal description)
      - `montant_cible` (numeric, target amount)
      - `montant_actuel` (numeric, current amount)
      - `deadline` (date, target date)
      - `statut` (text, goal status)
      - `created_at`, `updated_at` (timestamps)

    - `tontines` - Community savings groups
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `nom` (text, tontine name)
      - `description` (text, description)
      - `montant_cotisation` (numeric, contribution amount)
      - `frequence` (text, frequency)
      - `nombre_participants` (integer, participant count)
      - `statut` (text, tontine status)
      - `created_at` (timestamp)

    - `transactions_tontine` - Tontine transactions
      - `id` (uuid, primary key)
      - `tontine_id` (uuid, references tontines)
      - `user_id` (uuid, references profiles)
      - `montant` (numeric, transaction amount)
      - `type` (text, transaction type)
      - `date_transaction` (timestamp, transaction date)
      - `statut` (text, transaction status)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own records

  3. Relationships
    - All tables reference profiles(id) which references auth.users(id)
    - Proper foreign key constraints with CASCADE deletes
    - Categories can be referenced by expenses (optional)
    - Budgets can be referenced by expenses
    - Tontines can have multiple transactions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nom text NOT NULL,
  email text UNIQUE,
  pays text NOT NULL DEFAULT 'Cameroun',
  devise text NOT NULL DEFAULT 'FCFA',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mois text NOT NULL, -- YYYY-MM format
  revenu numeric DEFAULT 0 NOT NULL,
  total_depense numeric DEFAULT 0 NOT NULL,
  total_epargne numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, mois)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL,
  couleur text NOT NULL,
  icone text NOT NULL,
  budget_alloue numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, nom)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create depenses table
CREATE TABLE IF NOT EXISTS public.depenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  montant numeric NOT NULL,
  description text,
  date_depense date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON public.depenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.depenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.depenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.depenses
  FOR DELETE USING (auth.uid() = user_id);

-- Create objectifs table
CREATE TABLE IF NOT EXISTS public.objectifs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  titre text NOT NULL,
  description text,
  montant_cible numeric NOT NULL,
  montant_actuel numeric DEFAULT 0 NOT NULL,
  deadline date,
  statut text DEFAULT 'en_cours' NOT NULL CHECK (statut IN ('en_cours', 'atteint', 'abandonne')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.objectifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON public.objectifs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.objectifs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.objectifs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.objectifs
  FOR DELETE USING (auth.uid() = user_id);

-- Create tontines table
CREATE TABLE IF NOT EXISTS public.tontines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL,
  description text,
  montant_cotisation numeric NOT NULL,
  frequence text NOT NULL CHECK (frequence IN ('hebdomadaire', 'mensuel', 'trimestriel')),
  nombre_participants integer NOT NULL DEFAULT 1,
  statut text DEFAULT 'actif' NOT NULL CHECK (statut IN ('actif', 'termine', 'suspendu')),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tontines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tontines" ON public.tontines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tontines" ON public.tontines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tontines" ON public.tontines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tontines" ON public.tontines
  FOR DELETE USING (auth.uid() = user_id);

-- Create transactions_tontine table
CREATE TABLE IF NOT EXISTS public.transactions_tontine (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tontine_id uuid REFERENCES public.tontines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  montant numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('cotisation', 'reception')),
  date_transaction timestamptz DEFAULT now() NOT NULL,
  statut text NOT NULL CHECK (statut IN ('en_attente', 'paye', 'recu')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions_tontine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tontine transactions" ON public.transactions_tontine
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tontine transactions" ON public.transactions_tontine
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tontine transactions" ON public.transactions_tontine
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tontine transactions" ON public.transactions_tontine
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_mois ON public.budgets(user_id, mois);
CREATE INDEX IF NOT EXISTS idx_depenses_user_date ON public.depenses(user_id, date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON public.depenses(categorie_id);
CREATE INDEX IF NOT EXISTS idx_objectifs_user_statut ON public.objectifs(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_tontines_user_statut ON public.tontines(user_id, statut);
CREATE INDEX IF NOT EXISTS idx_transactions_tontine_user ON public.transactions_tontine(user_id, date_transaction);