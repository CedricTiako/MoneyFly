/*
  # Mise à jour des identifiants pour tiako1998@gmail.com
  
  1. Mise à jour du mot de passe
  2. Vérification de l'utilisateur
*/

-- Mettre à jour le mot de passe pour tiako1998@gmail.com
UPDATE auth.users 
SET encrypted_password = crypt('Douala237@@', gen_salt('bf'))
WHERE email = 'tiako1998@gmail.com';

-- Vérifier que l'utilisateur est bien configuré
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.nom,
  p.pays,
  p.devise
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'tiako1998@gmail.com';

-- Afficher un résumé des données utilisateur
SELECT 
  'COMPTE UTILISATEUR CONFIGURÉ' as status,
  u.email,
  p.nom,
  (SELECT COUNT(*) FROM budgets WHERE user_id = u.id) as budgets_count,
  (SELECT COUNT(*) FROM depenses WHERE user_id = u.id) as depenses_count,
  (SELECT COUNT(*) FROM objectifs WHERE user_id = u.id) as objectifs_count,
  (SELECT COUNT(*) FROM tontines WHERE user_id = u.id) as tontines_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'tiako1998@gmail.com';