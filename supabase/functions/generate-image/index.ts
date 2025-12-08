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
    const { prompt, ratio, resolution, imageUrls, photoNames } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Calculate exact pixel dimensions based on ratio and resolution
    const resolutionBasePixels: Record<string, number> = {
      "1K": 1024,
      "2K": 2048,
      "4K": 4096,
    };

    const ratioDimensions: Record<string, { w: number; h: number }> = {
      "1:1": { w: 1, h: 1 },
      "16:9": { w: 16, h: 9 },
      "9:16": { w: 9, h: 16 },
      "4:3": { w: 4, h: 3 },
    };

    const basePixels = resolutionBasePixels[resolution] || 1024;
    const ratioConfig = ratioDimensions[ratio] || { w: 1, h: 1 };
    
    // Calculate dimensions where the larger dimension equals basePixels
    let width: number;
    let height: number;
    if (ratioConfig.w >= ratioConfig.h) {
      width = basePixels;
      height = Math.round((basePixels * ratioConfig.h) / ratioConfig.w);
    } else {
      height = basePixels;
      width = Math.round((basePixels * ratioConfig.w) / ratioConfig.h);
    }

    const dimensionString = `${width}x${height} pixels`;
    const ratioDesc = `${ratio} aspect ratio`;
    
    // Include photo names in prompt if available
    let dishContext = "";
    if (photoNames && photoNames.length > 0) {
      dishContext = ` featuring ${photoNames.join(", ")}`;
    }
    
    const textPrompt = `Generate a professional burger restaurant marketing image at exactly ${dimensionString} (${ratioDesc})${dishContext}. ${prompt || 'Create an appetizing gourmet burger photo'}. 

IMPORTANT: This is for a burger restaurant. Generate the image at EXACTLY ${dimensionString}. Focus on burgers and burger-related items ONLY. Use the reference images as the exact style guide - match the burger presentation, lighting, and composition shown. Make it look delicious, high-quality, and perfect for restaurant marketing. Do NOT include pasta, sushi, or other non-burger items.`;
    
    console.log('Generating image with prompt:', textPrompt.substring(0, 300) + '...');
    console.log('Number of reference images:', imageUrls?.length || 0);

    // Build content array with text and images
    const content: any[] = [{ type: "text", text: textPrompt }];
    
    // Add reference images if provided
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
        model: "google/gemini-3-pro-image-preview",
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
    console.log('AI response status:', response.status);
    
    // Check for error in response
    if (data.error) {
      console.error('AI returned error:', data.error);
      throw new Error(data.error.message || 'AI generation failed');
    }
    
    // Extract the generated image
    const message = data.choices?.[0]?.message;
    let generatedImages: string[] = [];
    
    // Check for images array (Nano Banana format)
    if (message?.images && message.images.length > 0) {
      generatedImages = message.images
        .map((img: any) => img.image_url?.url || img.url)
        .filter(Boolean);
    }
    
    // Check for inline image in content
    if (generatedImages.length === 0 && message?.content) {
      const base64Match = message.content.match(/data:image\/[^;]+;base64,[^\s"]+/g);
      if (base64Match) {
        generatedImages = base64Match;
      }
    }
    
    if (generatedImages.length === 0) {
      console.error('No images found. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No image generated - try a simpler prompt or fewer reference images');
    }

    console.log('Successfully generated', generatedImages.length, 'image(s)');

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
