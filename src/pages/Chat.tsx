import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Megaphone, PenLine, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = "promotion" | "content" | "ads" | null;

interface QuickActionConfig {
  icon: React.ReactNode;
  label: string;
  fields: { name: string; label: string; type: "input" | "select"; options?: string[]; placeholder?: string }[];
  generatePrompt: (values: Record<string, string>) => string;
}

const quickActions: Record<Exclude<QuickAction, null>, QuickActionConfig> = {
  promotion: {
    icon: <Megaphone className="h-4 w-4" />,
    label: "Create a promotion",
    fields: [
      { name: "item", label: "Menu item", type: "input", placeholder: "e.g., Double Bacon Burger" },
      { name: "offer", label: "Offer type", type: "select", options: ["% Discount", "$ Off", "BOGO", "Free item with purchase", "Combo deal"] },
      { name: "occasion", label: "Occasion", type: "select", options: ["Weekend special", "Happy hour", "Limited time", "Holiday", "New item launch"] },
    ],
    generatePrompt: (v) => `Create a promotion for our ${v.item}. The offer is a ${v.offer} deal for a ${v.occasion}. Give me catchy copy for social media, suggested pricing strategy, and a timeline for the campaign.`,
  },
  content: {
    icon: <PenLine className="h-4 w-4" />,
    label: "Create content",
    fields: [
      { name: "subject", label: "What to feature", type: "input", placeholder: "e.g., Our new truffle fries" },
      { name: "platform", label: "Platform", type: "select", options: ["Instagram", "Facebook", "TikTok", "Twitter/X", "All platforms"] },
      { name: "style", label: "Content style", type: "select", options: ["Fun & playful", "Premium & elegant", "Bold & edgy", "Warm & inviting", "Trendy & viral"] },
    ],
    generatePrompt: (v) => `Create ${v.platform} content featuring ${v.subject}. The tone should be ${v.style}. Include caption, hashtags, and suggestions for the visual.`,
  },
  ads: {
    icon: <Target className="h-4 w-4" />,
    label: "Create an ad",
    fields: [
      { name: "product", label: "What to advertise", type: "input", placeholder: "e.g., Lunch special menu" },
      { name: "audience", label: "Target audience", type: "select", options: ["Families", "Young professionals", "Students", "Foodies", "Local community"] },
      { name: "goal", label: "Campaign goal", type: "select", options: ["Drive foot traffic", "Increase orders", "Brand awareness", "Promote new item", "Event promotion"] },
    ],
    generatePrompt: (v) => `Create an ad campaign for ${v.product} targeting ${v.audience}. The goal is to ${v.goal}. Include ad copy variations, headline options, and call-to-action suggestions.`,
  },
};

export default function Chat() {
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<QuickAction>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickAction = (action: Exclude<QuickAction, null>) => {
    setActiveAction(action);
    setFormValues({});
  };

  const handleFormSubmit = () => {
    if (!activeAction) return;
    const config = quickActions[activeAction];
    const allFilled = config.fields.every(f => formValues[f.name]?.trim());
    if (!allFilled) return;
    
    const prompt = config.generatePrompt(formValues);
    sendMessage(prompt);
    setActiveAction(null);
    setFormValues({});
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {hasMessages ? (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%]",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-3xl px-5 py-3"
                          : "text-foreground"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 py-3">
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 pb-8">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative bg-muted/50 rounded-2xl border border-border/50 overflow-hidden">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    className="min-h-[52px] max-h-40 resize-none border-0 bg-transparent pr-14 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-9 w-9 rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-full max-w-2xl space-y-6">
              {/* Main input */}
              <form onSubmit={handleSubmit}>
                <div className="relative bg-muted/50 rounded-2xl border border-border/50 overflow-hidden">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    className="min-h-[56px] max-h-40 resize-none border-0 bg-transparent pr-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2.5 bottom-2.5 h-10 w-10 rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Quick actions */}
              {!activeAction ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {(Object.keys(quickActions) as Exclude<QuickAction, null>[]).map((key) => {
                    const action = quickActions[key];
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2"
                        onClick={() => handleQuickAction(key)}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {quickActions[activeAction].icon}
                      {quickActions[activeAction].label}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setActiveAction(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    {quickActions[activeAction].fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{field.label}</Label>
                        {field.type === "input" ? (
                          <Input
                            placeholder={field.placeholder}
                            value={formValues[field.name] || ""}
                            onChange={(e) => setFormValues(v => ({ ...v, [field.name]: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        ) : (
                          <Select
                            value={formValues[field.name] || ""}
                            onValueChange={(val) => setFormValues(v => ({ ...v, [field.name]: val }))}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleFormSubmit}
                    disabled={!quickActions[activeAction].fields.every(f => formValues[f.name]?.trim())}
                    className="w-full rounded-xl"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
