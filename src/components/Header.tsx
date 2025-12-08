import { Utensils } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold text-foreground">
              MenuVision
            </h1>
            <p className="text-xs text-muted-foreground">AI Content Creator</p>
          </div>
        </div>
        
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
      </div>
    </header>
  );
}
