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
    const { prompt, ratio, resolution, photoAmount = 1, imageUrls, photoNames, styleGuideUrl } = await req.json();
    
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
    
    // Style guide instructions
    let styleInstructions = "";
    if (styleGuideUrl) {
      styleInstructions = `

STYLE REFERENCE: A style guide image is provided. Use this reference for general visual style (lighting setup, composition style, mood, background treatment). 

IMPORTANT - USER PROMPT OVERRIDES STYLE GUIDE: If the user's text prompt specifies different colors, saturation, brightness, contrast, or any other visual adjustments, PRIORITIZE THE USER'S TEXT INSTRUCTIONS over the style guide.

DO NOT copy any food from the style reference - use ONLY the food items from the menu photo references.`;
    }
    
    // Resolution quality hint for the model
    const resolutionQuality = resolution === "4K" ? "ultra high definition 4K quality" : (resolution === "2K" ? "high definition 2K quality" : "standard 1K quality");
    
    // Build the text prompt with resolution requirements embedded
    const textPrompt = `PRIORITY: Follow the user's prompt exactly. Respect their lighting, mood, and color choices.

${prompt || 'Create a professional food photography advertisement.'}

COMPOSITION: ${ratioDesc} at ${dimensionString}, ${resolutionQuality}.
IMAGE SIZE: Generate an image at exactly ${width}x${height} pixels resolution.
FOOD PROPORTIONS: Keep food items realistically proportioned to surroundings and consistent in size.${styleInstructions}`;
    
    console.log('Generating image with prompt:', textPrompt.substring(0, 400) + '...');
    console.log('Target resolution:', dimensionString);
    console.log('Number of menu photos:', imageUrls?.length || 0);
    console.log('Style guide provided:', !!styleGuideUrl);

    // Build content array with text and images
    const content: any[] = [{ type: "text", text: textPrompt }];
    
    // Add style guide first if provided
    if (styleGuideUrl) {
      content.push({
        type: "image_url",
        image_url: { url: styleGuideUrl }
      });
    }
    
    // Add ALL menu photo references
    if (imageUrls && imageUrls.length > 0) {
      for (const url of imageUrls) {
        content.push({
          type: "image_url",
          image_url: { url }
        });
      }
    }

    console.log('Using Gemini image model');
    console.log('Requested photo amount:', photoAmount);
    
    // Generate multiple images if requested
    const numImages = Math.min(Math.max(parseInt(photoAmount) || 1, 1), 4);
    const allGeneratedImages: string[] = [];
    
    for (let imageIndex = 0; imageIndex < numImages; imageIndex++) {
      console.log(`Generating image ${imageIndex + 1}/${numImages}`);
      
      // Retry logic for transient errors
      const maxRetries = 3;
      let lastError: Error | null = null;
      let response: Response | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} for image ${imageIndex + 1}`);
          
          // Use the documented API format - simpler without unsupported config options
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          
          // If we get a 5xx error and have retries left, wait and retry
          if (response.status >= 500 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Got ${response.status}, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          break;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Fetch error, retrying in ${waitTime}ms...`, lastError.message);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Failed to connect to AI gateway after retries');
      }

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
        if (response.status === 503 || response.status === 502 || response.status === 504) {
          return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`AI gateway error: ${response.status}`);
      }

      // Parse the response to check for errors in body and extract images
      const data = await response.json();
      console.log(`AI response received for image ${imageIndex + 1}`);
      
      // Check for error in response body (AI gateway can return 200 with error in body)
      if (data.error) {
        console.error('AI returned error in body:', data.error);
        return new Response(JSON.stringify({ 
          error: data.error.message || 'AI generation failed. Try reducing resolution or using fewer reference images.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      
      if (generatedImages.length > 0) {
        allGeneratedImages.push(...generatedImages);
        console.log(`Added ${generatedImages.length} image(s) from generation ${imageIndex + 1}`);
      } else {
        console.error(`No images found for generation ${imageIndex + 1}. Full response:`, JSON.stringify(data, null, 2));
      }
    }
    
    if (allGeneratedImages.length === 0) {
      throw new Error('No images generated - try a simpler prompt or fewer reference images');
    }

    console.log('Successfully generated', allGeneratedImages.length, 'total image(s)');

    return new Response(
      JSON.stringify({ images: allGeneratedImages }),
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
