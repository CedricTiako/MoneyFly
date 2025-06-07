import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export interface Profile {
  id: string;
  nom: string;
  email?: string;
  pays: string;
  devise: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  mois: string;
  revenu: number;
  total_depense: number;
  total_epargne: number;
  created_at: string;
  updated_at: string;
}

export interface Categorie {
  id: string;
  user_id: string;
  nom: string;
  couleur: string;
  icone: string;
  budget_alloue: number;
  created_at: string;
}

export interface Depense {
  id: string;
  user_id: string;
  budget_id: string;
  categorie_id?: string;
  montant: number;
  description?: string;
  date_depense: string;
  created_at: string;
  categories?: Categorie;
}

export interface Objectif {
  id: string;
  user_id: string;
  titre: string;
  description?: string;
  montant_cible: number;
  montant_actuel: number;
  deadline?: string;
  statut: 'en_cours' | 'atteint' | 'abandonne';
  created_at: string;
  updated_at: string;
}

export interface Tontine {
  id: string;
  user_id: string;
  nom: string;
  description?: string;
  montant_cotisation: number;
  frequence: string;
  nombre_participants: number;
  date_debut: string;
  statut: 'actif' | 'termine' | 'suspendu';
  created_at: string;
}

export interface TransactionTontine {
  id: string;
  tontine_id: string;
  user_id: string;
  montant: number;
  type: 'cotisation' | 'reception';
  date_transaction: string;
  statut: 'en_attente' | 'paye' | 'recu';
  notes?: string;
  created_at: string;
  tontines?: Tontine;
}