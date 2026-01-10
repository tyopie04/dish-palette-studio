import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchAnalyticsContext, formatAnalyticsForAI, AnalyticsContext } from "@/lib/analyticsContext";
import { supabase } from "@/integrations/supabase/client";

export type Message = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu-image`;

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsContext, setAnalyticsContext] = useState<AnalyticsContext | null>(null);
  const { toast } = useToast();

  // Fetch analytics on mount and set up realtime subscription
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const ctx = await fetchAnalyticsContext();
        setAnalyticsContext(ctx);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    loadAnalytics();

    // Subscribe to realtime updates for generations and menu_photos
    const channel = supabase
      .channel("analytics-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generations" },
        () => loadAnalytics()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_photos" },
        () => loadAnalytics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Generate image using the image generation endpoint
  const generateImage = useCallback(async (prompt: string): Promise<string | null> => {
    try {
      // Get the user's session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please log in to generate images");
      }

      const response = await fetch(IMAGE_GEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Image generation failed");
      }

      const data = await response.json();
      return data.imageUrl || null;
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string, images?: string[]) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent, images: images || m.images } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent, images }];
      });
    };

    try {
      // Get the user's session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please log in to use chat");
      }

      // Refresh analytics before sending
      const freshAnalytics = await fetchAnalyticsContext();
      setAnalyticsContext(freshAnalytics);
      const analyticsText = formatAnalyticsForAI(freshAnalytics);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          analyticsContext: analyticsText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Check if the response contains an image generation command
      const imageMatch = assistantContent.match(/\[GENERATE_IMAGE:\s*(.+?)\]/);
      if (imageMatch) {
        const imagePrompt = imageMatch[1].trim();
        // Update the message to show we're generating an image
        const cleanedContent = assistantContent.replace(/\[GENERATE_IMAGE:\s*(.+?)\]/, "🎨 Generating image...");
        setMessages(prev => prev.map((m, i) => 
          i === prev.length - 1 && m.role === "assistant" 
            ? { ...m, content: cleanedContent }
            : m
        ));

        // Generate the image
        const imageUrl = await generateImage(imagePrompt);
        
        if (imageUrl) {
          // Update with the generated image
          const finalContent = assistantContent.replace(/\[GENERATE_IMAGE:\s*(.+?)\]/, "Here's the image I created for you:");
          setMessages(prev => prev.map((m, i) => 
            i === prev.length - 1 && m.role === "assistant" 
              ? { ...m, content: finalContent, images: [imageUrl] }
              : m
          ));
        } else {
          // Failed to generate
          const failedContent = assistantContent.replace(/\[GENERATE_IMAGE:\s*(.+?)\]/, "Sorry, I couldn't generate the image. Please try again.");
          setMessages(prev => prev.map((m, i) => 
            i === prev.length - 1 && m.role === "assistant" 
              ? { ...m, content: failedContent }
              : m
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast, generateImage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages, analyticsContext };
}
