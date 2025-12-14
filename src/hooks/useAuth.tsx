import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { retryWithBackoff, clearStaleAuthTokens } from "@/lib/retryWithBackoff";

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  connectionStatus: ConnectionStatus;
  retryCount: number;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  retryConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [retryCount, setRetryCount] = useState(0);

  const initializeSession = useCallback(async () => {
    setConnectionStatus('connecting');
    setRetryCount(0);

    try {
      const result = await retryWithBackoff(
        async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return data;
        },
        {
          maxRetries: 5,
          initialDelayMs: 1000,
          onRetry: (attempt) => {
            setConnectionStatus('reconnecting');
            setRetryCount(attempt);
          },
        }
      );

      setSession(result.session);
      setUser(result.session?.user ?? null);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to initialize session after retries:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      
      // Clear stale tokens on 503 or upstream errors
      if (errorMessage.includes('503') || errorMessage.includes('upstream') || 
          errorMessage.includes('refresh_token') || errorMessage.includes('invalid')) {
        await supabase.auth.signOut();
        clearStaleAuthTokens();
      }
      
      setConnectionStatus('error');
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryConnection = useCallback(() => {
    // Clear stale tokens before retrying
    clearStaleAuthTokens();
    setLoading(false);
    setConnectionStatus('connected');
    // Don't try to restore session - just show login form
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH] State change:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AUTH] Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          clearStaleAuthTokens();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setConnectionStatus('connected');
        setLoading(false);
      }
    );

    // THEN check for existing session with retry logic
    initializeSession();

    return () => subscription.unsubscribe();
  }, [initializeSession]);

  // Session recovery when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[AUTH] App became visible, checking session...');
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession) {
            console.log('[AUTH] Session invalid or expired, clearing state');
            await supabase.auth.signOut();
            clearStaleAuthTokens();
            setSession(null);
            setUser(null);
          } else {
            console.log('[AUTH] Session still valid');
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (err) {
          console.error('[AUTH] Visibility check failed:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const signIn = async (email: string, password: string) => {
    setConnectionStatus('connecting');
    setRetryCount(0);

    try {
      const result = await retryWithBackoff(
        async () => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            // Don't retry on invalid credentials
            if (error.message.includes('Invalid login credentials')) {
              throw Object.assign(new Error(error.message), { noRetry: true });
            }
            throw error;
          }
          return { error: null };
        },
        {
          maxRetries: 5,
          initialDelayMs: 1000,
          onRetry: (attempt) => {
            setConnectionStatus('reconnecting');
            setRetryCount(attempt);
          },
        }
      );
      
      setConnectionStatus('connected');
      return result;
    } catch (error) {
      // Check if it's a "no retry" error (invalid credentials)
      if ((error as any)?.noRetry) {
        setConnectionStatus('connected');
        return { error: error as Error };
      }
      
      setConnectionStatus('error');
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    setConnectionStatus('connecting');
    setRetryCount(0);

    try {
      const result = await retryWithBackoff(
        async () => {
          const redirectUrl = `${window.location.origin}/`;
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectUrl }
          });
          if (error) {
            // Don't retry on user already exists
            if (error.message.includes('User already registered')) {
              throw Object.assign(new Error(error.message), { noRetry: true });
            }
            throw error;
          }
          return { error: null };
        },
        {
          maxRetries: 5,
          initialDelayMs: 1000,
          onRetry: (attempt) => {
            setConnectionStatus('reconnecting');
            setRetryCount(attempt);
          },
        }
      );
      
      setConnectionStatus('connected');
      return result;
    } catch (error) {
      if ((error as any)?.noRetry) {
        setConnectionStatus('connected');
        return { error: error as Error };
      }
      
      setConnectionStatus('error');
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearStaleAuthTokens();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      connectionStatus,
      retryCount,
      signIn, 
      signUp, 
      signOut,
      retryConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
