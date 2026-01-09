import { Moon, Sun, LogOut, User, CreditCard, Settings, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import staxLogo from "@/assets/stax-logo.png";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <img src={staxLogo} alt="Stax Burger Co." className="h-12 w-auto" />
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-sm text-foreground hover:text-primary transition-colors">
              Create
            </Link>
            <Link to="/promos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              One-click promos
            </Link>
            <Link to="/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Analytics
            </Link>
          </nav>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt={user.email || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Info</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" asChild>
                      <Link to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
