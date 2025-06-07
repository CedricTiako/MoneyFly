-- Requête SQL pour créer un utilisateur directement dans Supabase
-- ATTENTION: À utiliser uniquement en développement

-- 1. Créer l'utilisateur dans auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'tiako1998@gmail.com',
  crypt('VotreMotDePasse123!', gen_salt('bf')), -- Remplacez par votre mot de passe
  NOW(), -- Email confirmé immédiatement
  '{"provider": "email", "providers": ["email"]}',
  '{"nom": "Tiako Tchouameni Cedric Aime", "email": "tiako1998@gmail.com", "email_verified": true, "phone_verified": false}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Créer le profil utilisateur
INSERT INTO public.profiles (
  id,
  nom,
  email,
  pays,
  devise,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'tiako1998@gmail.com' ORDER BY created_at DESC LIMIT 1),
  'Tiako Tchouameni Cedric Aime',
  'tiako1998@gmail.com',
  'Cameroun',
  'FCFA',
  NOW(),
  NOW()
);

-- Vérification : afficher l'utilisateur créé
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nom,
  p.pays
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'tiako1998@gmail.com';