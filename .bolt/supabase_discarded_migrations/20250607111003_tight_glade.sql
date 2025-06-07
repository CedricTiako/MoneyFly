/*
  # Schéma initial pour l'application de gestion financière

  1. Nouvelles tables
    - `profiles` - Profils utilisateurs étendus
    - `budgets` - Budgets mensuels
    - `categories` - Catégories de dépenses
    - `depenses` - Dépenses individuelles
    - `objectifs` - Objectifs d'épargne
    - `tontines` - Gestion des tontines
    - `transactions_tontine` - Transactions des tontines

  2. Sécurité
    - Activation RLS sur toutes les tables
    - Politiques pour les utilisateurs authentifiés
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT,
  pays TEXT DEFAULT 'Cameroun',
  devise TEXT DEFAULT 'FCFA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des budgets mensuels
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mois TEXT NOT NULL, -- Format: "2025-01"
  revenu INTEGER DEFAULT 0,
  total_depense INTEGER DEFAULT 0,
  total_epargne INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mois)
);

-- Table des catégories de dépenses
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  couleur TEXT DEFAULT 'blue',
  icone TEXT DEFAULT 'wallet',
  budget_alloue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des dépenses
CREATE TABLE IF NOT EXISTS depenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
  categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  montant INTEGER NOT NULL,
  description TEXT,
  date_depense DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des objectifs d'épargne
CREATE TABLE IF NOT EXISTS objectifs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  montant_cible INTEGER NOT NULL,
  montant_actuel INTEGER DEFAULT 0,
  deadline DATE,
  statut TEXT DEFAULT 'en_cours', -- en_cours, atteint, abandonne
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des tontines
CREATE TABLE IF NOT EXISTS tontines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  montant_cotisation INTEGER NOT NULL,
  frequence TEXT DEFAULT 'mensuel', -- hebdomadaire, mensuel, trimestriel
  nombre_participants INTEGER DEFAULT 1,
  date_debut DATE DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'actif', -- actif, termine, suspendu
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des transactions de tontine
CREATE TABLE IF NOT EXISTS transactions_tontine (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tontine_id UUID REFERENCES tontines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  montant INTEGER NOT NULL,
  type TEXT NOT NULL, -- cotisation, reception
  date_transaction DATE DEFAULT CURRENT_DATE,
  statut TEXT DEFAULT 'en_attente', -- en_attente, paye, recu
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_tontine ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour budgets
CREATE POLICY "Users can manage own budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour categories
CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour depenses
CREATE POLICY "Users can manage own depenses"
  ON depenses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour objectifs
CREATE POLICY "Users can manage own objectifs"
  ON objectifs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour tontines
CREATE POLICY "Users can manage own tontines"
  ON tontines FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour transactions_tontine
CREATE POLICY "Users can manage own tontine transactions"
  ON transactions_tontine FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectifs_updated_at
  BEFORE UPDATE ON objectifs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();