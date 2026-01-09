import { LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

export function AdminHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-lg font-semibold text-foreground">Stax Admin</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to App</span>
          </Link>
        </Button>
        
        <span className="text-sm text-muted-foreground hidden sm:block">
          {user?.email}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
