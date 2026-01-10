import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Megaphone, PenLine, Target, X, Plus, Paperclip, MessageSquare, BarChart3, ArrowUp } from "lucide-react";
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
  const formRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close form when clicking outside
  useEffect(() => {
    if (!activeAction) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setActiveAction(null);
        setFormValues({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeAction]);

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(250,60%,45%)] via-[hsl(270,50%,50%)] to-[hsl(330,60%,55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(280,60%,50%,0.3),transparent)]" />
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[hsl(330,70%,60%)] opacity-40 blur-[150px] animate-float-slow top-0 right-0" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[hsl(280,60%,55%)] opacity-35 blur-[120px] animate-float-reverse bottom-0 left-0" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[hsl(320,65%,60%)] opacity-40 blur-[100px] animate-float-diagonal top-1/3 left-1/2" />
      
      <Header />
      
      <main className="flex-1 flex flex-col relative z-10">
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
                      <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%]",
                        message.role === "user"
                          ? "bg-white/20 backdrop-blur text-white rounded-3xl px-5 py-3"
                          : "text-white/90"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.images && message.images.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.images.map((img, imgIndex) => (
                            <img 
                              key={imgIndex} 
                              src={img} 
                              alt="Generated image" 
                              className="rounded-xl max-w-full w-full shadow-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-white/30 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4 justify-start">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1 py-3">
                      <span className="h-2 w-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 pb-8">
              <form onSubmit={handleSubmit} className="relative">
                <div className="bg-[hsl(220,20%,18%)] rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
                  {/* 3D edge highlight */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    className="min-h-[52px] max-h-40 resize-none border-0 bg-transparent text-white/80 placeholder:text-white/40 pr-4 pl-4 pt-4 pb-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white/60" />
                      </button>
                      <button type="button" className="h-9 px-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/60">Attach</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-9 px-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/60">Chat</span>
                      </button>
                      <button type="button" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white/60" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors flex items-center justify-center border border-white/20"
                      >
                        <ArrowUp className="h-4 w-4 text-white/80" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-full max-w-2xl space-y-8">
              {/* Greeting */}
              <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
                What should we create?
              </h1>

              {/* Main input - Lovable style */}
              <form onSubmit={handleSubmit}>
                <div className="bg-[hsl(220,20%,18%)] rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
                  {/* 3D edge highlight */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Stax to help you create content..."
                    className="min-h-[56px] max-h-40 resize-none border-0 bg-transparent text-white/80 placeholder:text-white/40 pr-4 pl-4 pt-4 pb-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white/60" />
                      </button>
                      <button type="button" className="h-9 px-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/60">Attach</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-9 px-4 rounded-full border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/60">Chat</span>
                      </button>
                      <button type="button" className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white/60" />
                      </button>
                      <button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors flex items-center justify-center border border-white/20"
                      >
                        <ArrowUp className="h-4 w-4 text-white/80" />
                      </button>
                    </div>
                  </div>
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
                        className="rounded-full gap-2 bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={() => handleQuickAction(key)}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div ref={formRef} className="bg-[hsl(220,20%,18%)] border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      {quickActions[activeAction].icon}
                      {quickActions[activeAction].label}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                      onClick={() => setActiveAction(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    {quickActions[activeAction].fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label className="text-xs text-white/50">{field.label}</Label>
                        {field.type === "input" ? (
                          <Input
                            placeholder={field.placeholder}
                            value={formValues[field.name] || ""}
                            onChange={(e) => setFormValues(v => ({ ...v, [field.name]: e.target.value }))}
                            className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          />
                        ) : (
                          <Select
                            value={formValues[field.name] || ""}
                            onValueChange={(val) => setFormValues(v => ({ ...v, [field.name]: val }))}
                          >
                            <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10 text-white">
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
                    className="w-full rounded-xl bg-white/20 hover:bg-white/30 text-white"
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
