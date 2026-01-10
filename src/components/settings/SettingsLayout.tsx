import { useState } from "react";
import { Header } from "@/components/Header";
import { Link, useLocation } from "react-router-dom";
import { Cable, User, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r border-border bg-card/30 p-4 transition-all duration-300 relative flex flex-col",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-muted z-10"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>

          {!collapsed && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          )}

          {collapsed && <div className="h-12" />}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              const linkContent = (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && item.title}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.url} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
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
