import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import staxLogo from "@/assets/stax-logo.png";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={staxLogo} alt="Stax Burger Co." className="h-12 w-auto" />
          <div>
            <h1 className="text-lg font-display font-semibold text-foreground">
              Stax
            </h1>
            <p className="text-xs text-muted-foreground">AI Content Creator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">
              Gallery
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Templates
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              History
            </a>
          </nav>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-primary" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
