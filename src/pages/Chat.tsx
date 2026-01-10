import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState("");
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

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {hasMessages ? (
          // Conversation view
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

            {/* Input - bottom fixed */}
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
          // Empty state - centered input
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-full max-w-2xl">
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
