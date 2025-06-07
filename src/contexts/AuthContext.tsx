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
        console.log('Auth event:', event, session);
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
      // Configuration pour forcer l'envoi d'OTP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: nom
          },
          emailRedirectTo: undefined, // Désactiver la redirection automatique
          captchaToken: undefined
        }
      });

      console.log('SignUp response:', { data, error });
      
      if (error) {
        throw error;
      }

      // Si l'utilisateur existe déjà mais n'est pas confirmé
      if (data.user && !data.session) {
        console.log('User needs email confirmation');
        return { data, error: null };
      }

      return { data, error };
    } catch (error) {
      console.error('SignUp error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => {
    try {
      console.log('Verifying OTP:', { email, token: token.length, type });
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(), // Supprimer les espaces
        type
      });

      console.log('OTP verification response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { data: null, error };
    }
  };

  const resendOtp = async (email: string, type: 'signup' | 'recovery') => {
    try {
      console.log('Resending OTP:', { email, type });
      
      const { data, error } = await supabase.auth.resend({
        type,
        email,
        options: {
          emailRedirectTo: undefined // Désactiver la redirection automatique
        }
      });

      console.log('Resend OTP response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { data: null, error };
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