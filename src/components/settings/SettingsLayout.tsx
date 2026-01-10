import { Header } from "@/components/Header";
import { Link, useLocation } from "react-router-dom";
import { Cable, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Account", url: "/settings", icon: User },
  { title: "Subscription", url: "/settings/subscription", icon: CreditCard },
  { title: "Integrations", url: "/settings/integrations", icon: Cable },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/30 p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your account</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
