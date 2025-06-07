/*
  # Correction et création des données de test pour tiako1998@gmail.com
  
  1. Correction de l'erreur de variable
  2. Création complète des données de test
  3. Vérification des données
*/

-- Variables pour l'utilisateur
DO $$
DECLARE
  user_uuid UUID;
  budget_id_current UUID;
  budget_id_prev UUID;
  budget_id_prev2 UUID; -- Correction: USD -> UUID
  
  -- Catégories IDs
  cat_epargne UUID;
  cat_logement UUID;
  cat_famille_bebe UUID;
  cat_famille_freres UUID;
  cat_famille_parents UUID;
  cat_personnel UUID;
  cat_famille_cousins UUID;
  cat_divers UUID;
  
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'tiako1998@gmail.com' LIMIT 1;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Utilisateur tiako1998@gmail.com non trouvé';
  END IF;

  -- Nettoyer les données existantes pour cet utilisateur
  DELETE FROM transactions_tontine WHERE user_id = user_uuid;
  DELETE FROM tontines WHERE user_id = user_uuid;
  DELETE FROM objectifs WHERE user_id = user_uuid;
  DELETE FROM depenses WHERE user_id = user_uuid;
  DELETE FROM budgets WHERE user_id = user_uuid;
  DELETE FROM categories WHERE user_id = user_uuid;

  -- 1. CRÉER LES CATÉGORIES DÉTAILLÉES
  
  -- Épargne
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Épargne', 'green', 'piggy-bank', 150000)
  RETURNING id INTO cat_epargne;
  
  -- Logement
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Logement', 'blue', 'home', 40000)
  RETURNING id INTO cat_logement;
  
  -- Famille - Bébé + Maman
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Bébé + Maman', 'pink', 'baby', 50000)
  RETURNING id INTO cat_famille_bebe;
  
  -- Famille - Petits frères
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Petits frères', 'purple', 'users', 35000)
  RETURNING id INTO cat_famille_freres;
  
  -- Famille - Parents + Grands-parents
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Parents + Grands-parents', 'orange', 'heart', 30000)
  RETURNING id INTO cat_famille_parents;
  
  -- Dépenses personnelles
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Dépenses personnelles', 'indigo', 'user', 60000)
  RETURNING id INTO cat_personnel;
  
  -- Cousins & cousines
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Cousins & cousines', 'yellow', 'users', 15000)
  RETURNING id INTO cat_famille_cousins;
  
  -- Divers / Imprévus
  INSERT INTO categories (id, user_id, nom, couleur, icone, budget_alloue) 
  VALUES (gen_random_uuid(), user_uuid, 'Divers / Imprévus', 'red', 'alert-circle', 20000)
  RETURNING id INTO cat_divers;

  -- 2. CRÉER LES BUDGETS (3 derniers mois)
  
  -- Budget actuel (Décembre 2024)
  INSERT INTO budgets (id, user_id, mois, revenu, total_depense, total_epargne) 
  VALUES (gen_random_uuid(), user_uuid, '2024-12', 400000, 250000, 150000)
  RETURNING id INTO budget_id_current;
  
  -- Budget précédent (Novembre 2024)
  INSERT INTO budgets (id, user_id, mois, revenu, total_depense, total_epargne) 
  VALUES (gen_random_uuid(), user_uuid, '2024-11', 400000, 242000, 150000)
  RETURNING id INTO budget_id_prev;
  
  -- Budget d'avant (Octobre 2024)
  INSERT INTO budgets (id, user_id, mois, revenu, total_depense, total_epargne) 
  VALUES (gen_random_uuid(), user_uuid, '2024-10', 400000, 228000, 150000)
  RETURNING id INTO budget_id_prev2;

  -- 3. CRÉER LES DÉPENSES DÉTAILLÉES (Décembre 2024)
  
  -- LOGEMENT (40 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_logement, 40000, 'Loyer mensuel', '2024-12-01');
  
  -- BÉBÉ + MAMAN (50 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_famille_bebe, 15000, 'Lait et couches bébé', '2024-12-03'),
  (user_uuid, budget_id_current, cat_famille_bebe, 12000, 'Vêtements bébé', '2024-12-07'),
  (user_uuid, budget_id_current, cat_famille_bebe, 8000, 'Médicaments maman', '2024-12-10'),
  (user_uuid, budget_id_current, cat_famille_bebe, 10000, 'Alimentation spéciale maman', '2024-12-15'),
  (user_uuid, budget_id_current, cat_famille_bebe, 5000, 'Produits d''hygiène bébé', '2024-12-20');
  
  -- PETITS FRÈRES (35 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_famille_freres, 12500, 'Jores - Frais scolaires et repas', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_freres, 10000, 'Claude - Soutien mensuel', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_freres, 7500, 'Ader - Aide scolaire', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_freres, 5000, 'Donal - Soutien mensuel', '2024-12-01');
  
  -- PARENTS + GRANDS-PARENTS (30 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_famille_parents, 10000, 'Maman - Soutien mensuel', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_parents, 5000, 'Papa - Aide mensuelle', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_parents, 5000, 'Maman Marguerite - Soutien', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_parents, 5000, 'Papa Michel - Aide', '2024-12-01'),
  (user_uuid, budget_id_current, cat_famille_parents, 5000, 'Papa Emma - Soutien', '2024-12-01');
  
  -- DÉPENSES PERSONNELLES (60 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_personnel, 25000, 'Alimentation personnelle', '2024-12-02'),
  (user_uuid, budget_id_current, cat_personnel, 15000, 'Transport (taxi, moto)', '2024-12-05'),
  (user_uuid, budget_id_current, cat_personnel, 8000, 'Communication (crédit téléphone)', '2024-12-08'),
  (user_uuid, budget_id_current, cat_personnel, 7000, 'Vêtements personnels', '2024-12-12'),
  (user_uuid, budget_id_current, cat_personnel, 5000, 'Produits d''hygiène personnelle', '2024-12-18');
  
  -- COUSINS & COUSINES (15 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_famille_cousins, 8000, 'Aide ponctuelle cousin Jean', '2024-12-06'),
  (user_uuid, budget_id_current, cat_famille_cousins, 7000, 'Soutien cousine Marie', '2024-12-14');
  
  -- DIVERS / IMPRÉVUS (20 000 FCFA)
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_current, cat_divers, 8000, 'Facture électricité', '2024-12-04'),
  (user_uuid, budget_id_current, cat_divers, 6000, 'Consultation médicale urgente', '2024-12-11'),
  (user_uuid, budget_id_current, cat_divers, 4000, 'Réparation téléphone', '2024-12-16'),
  (user_uuid, budget_id_current, cat_divers, 2000, 'Frais bancaires', '2024-12-22');

  -- 4. DÉPENSES NOVEMBRE 2024
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_prev, cat_logement, 40000, 'Loyer mensuel', '2024-11-01'),
  (user_uuid, budget_id_prev, cat_famille_bebe, 52000, 'Soins bébé + maman', '2024-11-15'),
  (user_uuid, budget_id_prev, cat_famille_freres, 35000, 'Soutien frères', '2024-11-01'),
  (user_uuid, budget_id_prev, cat_famille_parents, 30000, 'Soutien parents/grands-parents', '2024-11-01'),
  (user_uuid, budget_id_prev, cat_personnel, 62000, 'Dépenses personnelles', '2024-11-10'),
  (user_uuid, budget_id_prev, cat_famille_cousins, 13000, 'Aide cousins', '2024-11-20'),
  (user_uuid, budget_id_prev, cat_divers, 10000, 'Imprévus et urgences', '2024-11-25');

  -- 5. DÉPENSES OCTOBRE 2024
  INSERT INTO depenses (user_id, budget_id, categorie_id, montant, description, date_depense) VALUES
  (user_uuid, budget_id_prev2, cat_logement, 40000, 'Loyer mensuel', '2024-10-01'),
  (user_uuid, budget_id_prev2, cat_famille_bebe, 48000, 'Soins bébé + maman', '2024-10-15'),
  (user_uuid, budget_id_prev2, cat_famille_freres, 35000, 'Soutien frères', '2024-10-01'),
  (user_uuid, budget_id_prev2, cat_famille_parents, 30000, 'Soutien parents/grands-parents', '2024-10-01'),
  (user_uuid, budget_id_prev2, cat_personnel, 58000, 'Dépenses personnelles', '2024-10-10'),
  (user_uuid, budget_id_prev2, cat_famille_cousins, 12000, 'Aide cousins', '2024-10-20'),
  (user_uuid, budget_id_prev2, cat_divers, 5000, 'Imprévus', '2024-10-25');

  -- Mettre à jour les totaux des budgets
  UPDATE budgets SET total_depense = (
    SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE budget_id = budget_id_current
  ) WHERE id = budget_id_current;

  UPDATE budgets SET total_depense = (
    SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE budget_id = budget_id_prev
  ) WHERE id = budget_id_prev;

  UPDATE budgets SET total_depense = (
    SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE budget_id = budget_id_prev2
  ) WHERE id = budget_id_prev2;

  -- 6. CRÉER LES OBJECTIFS D'ÉPARGNE
  
  -- Objectif principal : 2M FCFA/an
  INSERT INTO objectifs (user_id, titre, description, montant_cible, montant_actuel, deadline, statut) VALUES
  (user_uuid, 'Épargne annuelle 2025', 'Objectif d''épargner 2 000 000 FCFA sur l''année 2025', 2000000, 450000, '2025-12-31', 'en_cours');
  
  -- Objectif secondaire : Fonds d'urgence
  INSERT INTO objectifs (user_id, titre, description, montant_cible, montant_actuel, deadline, statut) VALUES
  (user_uuid, 'Fonds d''urgence familial', 'Constituer un fonds d''urgence pour la famille', 500000, 125000, '2025-06-30', 'en_cours');
  
  -- Objectif : Projet immobilier
  INSERT INTO objectifs (user_id, titre, description, montant_cible, montant_actuel, deadline, statut) VALUES
  (user_uuid, 'Projet immobilier', 'Épargne pour l''achat d''un terrain ou construction', 5000000, 450000, '2027-12-31', 'en_cours');

  -- 7. CRÉER LES TONTINES
  
  -- Tontine familiale
  INSERT INTO tontines (user_id, nom, description, montant_cotisation, frequence, nombre_participants, statut) VALUES
  (user_uuid, 'Tontine Famille Tchouameni', 'Tontine familiale pour les projets communs', 50000, 'mensuel', 8, 'actif');
  
  -- Tontine amis/collègues
  INSERT INTO tontines (user_id, nom, description, montant_cotisation, frequence, nombre_participants, statut) VALUES
  (user_uuid, 'Tontine des Amis', 'Tontine entre amis pour l''entraide', 25000, 'mensuel', 6, 'actif');

  -- 8. TRANSACTIONS TONTINE (historique)
  
  -- Tontine familiale - transactions récentes
  INSERT INTO transactions_tontine (tontine_id, user_id, montant, type, date_transaction, statut) VALUES
  ((SELECT id FROM tontines WHERE nom = 'Tontine Famille Tchouameni' AND user_id = user_uuid), user_uuid, 50000, 'cotisation', '2024-12-01', 'paye'),
  ((SELECT id FROM tontines WHERE nom = 'Tontine Famille Tchouameni' AND user_id = user_uuid), user_uuid, 50000, 'cotisation', '2024-11-01', 'paye'),
  ((SELECT id FROM tontines WHERE nom = 'Tontine Famille Tchouameni' AND user_id = user_uuid), user_uuid, 400000, 'reception', '2024-10-15', 'recu');
  
  -- Tontine amis - transactions récentes
  INSERT INTO transactions_tontine (tontine_id, user_id, montant, type, date_transaction, statut) VALUES
  ((SELECT id FROM tontines WHERE nom = 'Tontine des Amis' AND user_id = user_uuid), user_uuid, 25000, 'cotisation', '2024-12-01', 'paye'),
  ((SELECT id FROM tontines WHERE nom = 'Tontine des Amis' AND user_id = user_uuid), user_uuid, 25000, 'cotisation', '2024-11-01', 'paye');

  RAISE NOTICE 'Données de test créées avec succès pour tiako1998@gmail.com';

END $$;

-- Vérification finale des données
SELECT 
  'RÉSUMÉ DES DONNÉES CRÉÉES' as info,
  (SELECT COUNT(*) FROM categories WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com')) as categories_count,
  (SELECT COUNT(*) FROM budgets WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com')) as budgets_count,
  (SELECT COUNT(*) FROM depenses WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com')) as depenses_count,
  (SELECT COUNT(*) FROM objectifs WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com')) as objectifs_count,
  (SELECT COUNT(*) FROM tontines WHERE user_id = (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com')) as tontines_count;