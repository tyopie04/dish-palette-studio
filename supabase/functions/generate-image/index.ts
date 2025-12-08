import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, imageUrls } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating image with prompt:', prompt, 'style:', style);

    // Build the content array for the message
    const content: any[] = [];
    
    // Add the text prompt
    const styleDescriptions: Record<string, string> = {
      social: "Instagram-ready square format, vibrant and appetizing food photography",
      banner: "Wide promotional banner format, professional restaurant marketing",
      story: "Vertical story format, engaging and scroll-stopping",
      artistic: "Creative artistic style, unique and memorable visual"
    };
    
    const styleDesc = styleDescriptions[style] || styleDescriptions.social;
    const fullPrompt = `Create a professional ${styleDesc} featuring: ${prompt || 'delicious restaurant food'}. Make it look appetizing, high-quality, and suitable for restaurant marketing.`;
    
    content.push({
      type: "text",
      text: fullPrompt
    });

    // Add any reference images if provided
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        content.push({
          type: "image_url",
          image_url: { url }
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data, null, 2));
    
    // Extract the generated image - check multiple possible response structures
    const message = data.choices?.[0]?.message;
    let generatedImages: string[] = [];
    
    // Check for images array (Nano Banana format)
    if (message?.images && message.images.length > 0) {
      generatedImages = message.images
        .map((img: any) => img.image_url?.url || img.url)
        .filter(Boolean);
    }
    
    // Check for inline image in content (alternative format)
    if (generatedImages.length === 0 && message?.content) {
      // Sometimes the image is embedded in the content as base64
      const base64Match = message.content.match(/data:image\/[^;]+;base64,[^\s"]+/g);
      if (base64Match) {
        generatedImages = base64Match;
      }
    }
    
    if (generatedImages.length === 0) {
      console.error('No images found in response structure:', JSON.stringify(message, null, 2));
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ images: generatedImages }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
