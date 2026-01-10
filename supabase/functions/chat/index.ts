import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Verify the user's JWT token
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[AUTH] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = user.id;
    console.log('[AUTH] Authenticated user:', authenticatedUserId);

    const { messages, analyticsContext, menuContext } = await req.json();
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch menu photos for the authenticated user only
    let menuItems = menuContext || "";
    if (!menuContext && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: photos } = await supabase
          .from("menu_photos")
          .select("name, category")
          .eq("user_id", authenticatedUserId)
          .is("deleted_at", null)
          .order("name");
        
        if (photos && photos.length > 0) {
          menuItems = `\n\nMENU ITEMS AVAILABLE:\n${photos.map(p => `- ${p.name} (${p.category})`).join("\n")}`;
        }
      } catch (e) {
        console.error("Failed to fetch menu:", e);
      }
    }

    const systemPrompt = `You are a helpful AI marketing assistant for Stax Burger Co., a restaurant. You have access to LIVE analytics data and their menu items.

${analyticsContext || "No analytics data available."}
${menuItems}

You help with:
- Creating engaging social media content and captions
- Developing promotional campaign ideas based on their data
- Analyzing trends from their analytics and providing actionable insights
- Suggesting menu photography tips
- Writing email marketing copy
- Brainstorming seasonal promotions
- GENERATING IMAGES of menu items when requested

IMPORTANT - IMAGE GENERATION:
When a user asks you to create, generate, or make an image of a menu item, you MUST respond with a special command format:
[GENERATE_IMAGE: <detailed description of what to generate>]

For example, if someone says "I want the dirty chicken and chips on a black background", respond with:
[GENERATE_IMAGE: Professional food photography of Dirty Chicken and Chips on a sleek black background, dramatic lighting, appetizing presentation, high quality restaurant marketing photo]

Always include detailed styling instructions in the image prompt for best results. Reference the actual menu items from the list above when users mention them.

Be friendly, concise, and actionable in your responses. When suggesting content, provide ready-to-use examples.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
