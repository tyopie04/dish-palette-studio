import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import staxLogo from "@/assets/stax-logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { 
    signIn, 
    signUp, 
    user, 
    loading: authLoading, 
    connectionStatus, 
    retryCount,
    retryConnection 
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        const errorMessage = error.message || String(error) || '';
        
        // Handle specific error messages
        if (errorMessage.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (errorMessage.includes("User already registered")) {
          toast.error("This email is already registered. Try logging in.");
        } else if (
          errorMessage.includes("503") || 
          errorMessage.includes("upstream") || 
          errorMessage.includes("connection") ||
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          toast.error("Server is temporarily unavailable. Please wait a moment and try again.");
        } else if (errorMessage && errorMessage !== '{}' && errorMessage !== '[object Object]') {
          toast.error(errorMessage);
        } else {
          toast.error("Unable to connect. The server may still be waking up - please try again in a few seconds.");
        }
      } else if (!isLogin) {
        toast.success("Account created! You can now log in.");
        setIsLogin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking initial auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        {connectionStatus === 'connecting' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Connecting to server...</p>
          </>
        )}
        
        {connectionStatus === 'reconnecting' && (
          <>
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-muted-foreground">
              Server is waking up... Retry {retryCount}/5
            </p>
            <p className="text-sm text-muted-foreground/60">
              This can take up to 30 seconds after inactivity
            </p>
          </>
        )}
        
        {connectionStatus === 'error' && (
          <>
            <WifiOff className="w-8 h-8 text-destructive" />
            <p className="text-muted-foreground">Unable to connect to server</p>
            <Button onClick={retryConnection} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src={staxLogo} 
            alt="Stax" 
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isLogin 
              ? "Sign in to access your menu photos and creations" 
              : "Start creating stunning content for your menu"}
          </p>
        </div>

        {/* Connection status indicator during login - only show during reconnecting */}
        {connectionStatus === 'reconnecting' && !authLoading && (
          <div className="p-3 rounded-lg text-center text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Server is waking up... Retry {retryCount}/5</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {connectionStatus === 'reconnecting' 
                  ? `Connecting... (${retryCount}/5)`
                  : isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              isLogin ? "Sign in" : "Create account"
            )}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
          
          <div className="pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('skipAuth', 'true');
                navigate('/');
              }}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Continue Without Login (Testing Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
