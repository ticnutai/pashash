import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Single source of truth for authentication state.
 * 
 * BEFORE: 6+ independent getSession() calls + 6 onAuthStateChange listeners on mount.
 * AFTER:  1 getSession() call + 1 onAuthStateChange listener, shared via context.
 * 
 * This eliminates ~5 redundant Supabase auth network requests on every page load.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single auth check for the entire app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Single listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    userId: user?.id ?? null,
    loading,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
