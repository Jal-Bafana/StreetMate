import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  email: string;
  name: string;
  user_type: string;
  is_verified: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, userType: 'vendor' | 'seller') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Helper to fetch or create profile
const fetchOrCreateProfile = async (
  user: User,
  setProfile: (profile: Profile | null) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setLoading(false);
      return;
    }
    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      // If profile does not exist, create it with available user metadata
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.name || '',
          user_type: user.user_metadata?.user_type || 'seller',
          is_verified: false,
        })
        .select()
        .maybeSingle();
      if (insertError) {
        console.error('Error creating profile:', insertError);
        setProfile(null);
      } else {
        setProfile(insertData as Profile);
      }
    }
  } catch (err) {
    console.error('Profile fetch/create error:', err);
    setProfile(null);
  } finally {
    setLoading(false);
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          fetchOrCreateProfile(session.user, setProfile, setLoading);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchOrCreateProfile(session.user, setProfile, setLoading);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const signUp = async (email: string, password: string, name: string, userType: 'vendor' | 'seller') => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          user_type: userType
        }
      }
    });
    return { error };
  };


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };


  const signOut = async () => {
    await supabase.auth.signOut();
  };


  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }
    return { error };
  };


  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};