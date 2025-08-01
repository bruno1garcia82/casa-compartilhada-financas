import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const signUp = async (email: string, password: string, name: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        name: name
      }
    }
  });
  
  return { error };
};

export const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { error };
};

export const signOut = async () => {
  try {
    // Verificar se há uma sessão ativa antes de tentar logout
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Se não há sessão, já consideramos como logout bem-sucedido
      return { error: null };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error: any) {
    // Se houver qualquer erro, ainda consideramos como logout bem-sucedido
    // pois o objetivo é limpar a sessão local
    console.warn('Warning during logout:', error);
    return { error: null };
  }
};