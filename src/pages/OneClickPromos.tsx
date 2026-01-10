import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Tag, Camera, Megaphone, Mail, Clock, Sparkles } from "lucide-react";
import staxLogo from "@/assets/stax-logo.png";
import { PromotionsForm } from "@/components/campaigns/PromotionsForm";
import { ContentForm } from "@/components/campaigns/ContentForm";
import { AdsForm } from "@/components/campaigns/AdsForm";
import { EmailForm } from "@/components/campaigns/EmailForm";
import { cn } from "@/lib/utils";

interface CampaignType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const campaignTypes: CampaignType[] = [
  {
    id: "promotions",
    title: "One-Click Promotions",
    description: "Generate targeted promotions for your customers",
    icon: <Tag className="h-8 w-8" />,
  },
  {
    id: "content",
    title: "One-Click Content",
    description: "Create engaging social media content automatically",
    icon: <Camera className="h-8 w-8" />,
  },
  {
    id: "ads",
    title: "One-Click Ads",
    description: "Launch advertising campaigns with one click",
    icon: <Megaphone className="h-8 w-8" />,
  },
  {
    id: "email",
    title: "One-Click Email",
    description: "Create email marketing campaigns instantly",
    icon: <Mail className="h-8 w-8" />,
  },
];

export default function OneClickPromos() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    setExpandedCard(id);
  };

  const handleClose = () => {
    setExpandedCard(null);
  };

  const renderForm = (typeId: string) => {
    switch (typeId) {
      case "promotions":
        return <PromotionsForm onClose={handleClose} />;
      case "content":
        return <ContentForm onClose={handleClose} />;
      case "ads":
        return <AdsForm onClose={handleClose} />;
      case "email":
        return <EmailForm onClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-border/50 bg-muted/30 flex flex-col">
          {/* Logo Section */}
          <div className="p-4 border-b border-border/50">
            <img src={staxLogo} alt="Stax Burger Co." className="h-10 w-auto mx-auto" />
          </div>

          {/* Create New Button */}
          <div className="p-4">
            <Button className="w-full gap-2" size="lg">
              <Plus className="h-5 w-5" />
              Create New
            </Button>
          </div>

          {/* History Section */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                History
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center py-8">
                  Your campaign history will appear here
                </p>
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                One-Click Campaign Generator
              </h1>
              <p className="text-muted-foreground">
                Choose a campaign type to get started
              </p>
            </div>

            {/* Campaign Type Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {campaignTypes.map((type) => (
                <div
                  key={type.id}
                  className={cn(
                    "relative aspect-square rounded-xl border transition-all duration-300 overflow-hidden",
                    expandedCard === type.id
                      ? "border-primary bg-card"
                      : "border-border bg-card/50 hover:border-primary/50 hover:bg-card cursor-pointer"
                  )}
                  onMouseEnter={() => setHoveredCard(type.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => !expandedCard && handleCardClick(type.id)}
                >
                  {expandedCard === type.id ? (
                    // Expanded Form View
                    <div className="absolute inset-0">
                      {renderForm(type.id)}
                    </div>
                  ) : (
                    // Card Preview View
                    <>
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="p-4 rounded-2xl bg-primary/10 text-primary mb-4">
                          {type.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {type.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>

                      {/* Hover Build Button */}
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200",
                          hoveredCard === type.id ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                      >
                        <Button size="lg" className="gap-2">
                          <Sparkles className="h-5 w-5" />
                          Build
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
