import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nom: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => Promise<any>;
  resendOtp: (email: string, type: 'signup' | 'recovery') => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const newProfile = {
            id: userData.user.id,
            nom: userData.user.user_metadata?.nom || 'Utilisateur',
            email: userData.user.email,
            pays: 'Cameroun',
            devise: 'FCFA'
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (!createError) {
            setProfile(createdProfile);
          }
        }
      } else if (!error) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nom: string) => {
    try {
      console.log('Attempting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            nom: nom.trim()
          }
        }
      });

      console.log('SignUp response:', { 
        user: data.user?.id, 
        session: !!data.session, 
        error: error?.message 
      });
      
      if (error) {
        // Gérer les erreurs spécifiques
        if (error.message.includes('User already registered')) {
          return { 
            data: null, 
            error: { 
              message: 'Un compte existe déjà avec cet email. Essayez de vous connecter ou de réinitialiser votre mot de passe.' 
            } 
          };
        }
        throw error;
      }

      // Si l'utilisateur est créé mais pas de session (email non confirmé)
      if (data.user && !data.session) {
        console.log('User created, email confirmation required');
        return { 
          data, 
          error: null,
          needsVerification: true 
        };
      }

      // Si l'utilisateur est créé et connecté directement
      if (data.user && data.session) {
        console.log('User created and logged in directly');
        return { data, error: null };
      }

      return { data, error };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Erreur lors de la création du compte' 
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      console.log('SignIn response:', { 
        user: data.user?.id, 
        session: !!data.session, 
        error: error?.message 
      });

      if (error) {
        // Gérer les erreurs spécifiques
        if (error.message.includes('Email not confirmed')) {
          return { 
            data: null, 
            error: { 
              message: 'Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte mail et entrer le code de vérification.',
              needsVerification: true
            } 
          };
        }
        if (error.message.includes('Invalid login credentials')) {
          return { 
            data: null, 
            error: { 
              message: 'Email ou mot de passe incorrect.' 
            } 
          };
        }
        throw error;
      }

      return { data, error };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Erreur lors de la connexion' 
        } 
      };
    }
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => {
    try {
      console.log('Verifying OTP for:', email, 'Type:', type);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: token.trim(),
        type
      });

      console.log('OTP verification response:', { 
        user: data.user?.id, 
        session: !!data.session, 
        error: error?.message 
      });

      if (error) {
        if (error.message.includes('Token has expired')) {
          return { 
            data: null, 
            error: { 
              message: 'Le code a expiré. Demandez un nouveau code.' 
            } 
          };
        }
        if (error.message.includes('Invalid token') || error.message.includes('Token not found')) {
          return { 
            data: null, 
            error: { 
              message: 'Code invalide. Vérifiez le code et réessayez.' 
            } 
          };
        }
        throw error;
      }

      return { data, error };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Erreur lors de la vérification du code' 
        } 
      };
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'recovery') => {
    try {
      console.log('Resending OTP for:', email, 'Type:', type);
      
      const { data, error } = await supabase.auth.resend({
        type,
        email: email.toLowerCase().trim()
      });

      console.log('Resend OTP response:', { data, error: error?.message });

      if (error) {
        if (error.message.includes('For security purposes')) {
          return { 
            data: null, 
            error: { 
              message: 'Veuillez attendre avant de demander un nouveau code.' 
            } 
          };
        }
        throw error;
      }

      return { data, error };
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Erreur lors du renvoi du code' 
        } 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    verifyOtp,
    resendOtp,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}