import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Tag, Camera, Megaphone, Clock } from "lucide-react";
import staxLogo from "@/assets/stax-logo.png";

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
];

export default function OneClickPromos() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
          <div className="container max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                One-Click Campaign Generator
              </h1>
              <p className="text-muted-foreground">
                Choose a campaign type to get started
              </p>
            </div>

            {/* Campaign Type Cards */}
            <div className="grid gap-4">
              {campaignTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
                    selectedType === type.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {type.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end">
                      <Button
                        variant={selectedType === type.id ? "default" : "outline"}
                        size="sm"
                      >
                        {selectedType === type.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
