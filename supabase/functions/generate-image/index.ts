import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brain: Gemini 2.5 Pro for reasoning and blueprint creation
async function createImageBlueprint(
  LOVABLE_API_KEY: string,
  userPrompt: string,
  ratio: string,
  resolution: string,
  dimensionString: string,
  photoNames: string[],
  hasStyleGuide: boolean
): Promise<{ blueprint: string; reasoning: string }> {
  
  const systemPrompt = `You are an expert food photography art director. Your job is to analyze the user's request and create a precise, detailed blueprint for an AI image generator to follow.

TASK: Create an extremely detailed image generation prompt that will produce exactly what the user wants.

INPUT CONTEXT:
- Aspect ratio: ${ratio}
- Resolution: ${dimensionString}
- Menu items available: ${photoNames.length > 0 ? photoNames.join(', ') : 'None specified'}
- Style guide provided: ${hasStyleGuide ? 'Yes - use it for lighting, mood, and composition style' : 'No'}

YOUR OUTPUT MUST BE A JSON OBJECT with these fields:
{
  "reasoning": "Your analysis of what the user wants and why you're making certain creative decisions (2-3 sentences)",
  "imagePrompt": "The complete, detailed prompt for the image generator. Be EXTREMELY specific about:
    - Exact positioning and arrangement of food items
    - Lighting direction, quality, and color temperature
    - Background details (color, texture, gradient direction if any)
    - Camera angle and perspective
    - Mood and atmosphere
    - Any text, graphics, or design elements
    - Color palette specifics
    - Depth of field and focus
    - Any motion/action elements (splashing, floating, steam, etc.)
  "
}

RULES:
1. ALWAYS prioritize the user's explicit requests over assumptions
2. If user mentions colors, lighting, or mood - use EXACTLY what they specify
3. Be specific about spatial relationships (left/right, foreground/background, etc.)
4. Include realistic proportions and food styling details
5. The imagePrompt should be self-contained - the image generator won't see the original user request`;

  console.log('[BRAIN] Calling Gemini 2.5 Pro for reasoning...');
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[BRAIN] Error:', response.status, errorText);
    throw new Error(`Brain reasoning failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Brain returned empty response');
  }

  console.log('[BRAIN] Raw response:', content.substring(0, 500) + '...');
  
  // Parse the JSON response
  try {
    // Extract JSON from potential markdown code blocks
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    console.log('[BRAIN] Reasoning:', parsed.reasoning);
    console.log('[BRAIN] Blueprint prompt length:', parsed.imagePrompt?.length || 0);
    
    return {
      blueprint: parsed.imagePrompt || content,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
  } catch (parseError) {
    console.log('[BRAIN] Could not parse as JSON, using raw content as blueprint');
    return {
      blueprint: content,
      reasoning: 'Direct prompt interpretation'
    };
  }
}

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
    
    console.log('=== BRAIN + HAND ARCHITECTURE ===');
    console.log('Target resolution:', dimensionString);
    console.log('Number of menu photos:', imageUrls?.length || 0);
    console.log('Photo names:', photoNames?.join(', ') || 'None');
    console.log('Style guide provided:', !!styleGuideUrl);

    // ========== PHASE 1: BRAIN (Gemini 2.5 Pro) ==========
    // The Brain analyzes the request and creates a detailed blueprint
    const { blueprint, reasoning } = await createImageBlueprint(
      LOVABLE_API_KEY,
      prompt || 'Create a professional food photography advertisement.',
      ratio,
      resolution,
      dimensionString,
      photoNames || [],
      !!styleGuideUrl
    );
    
    console.log('[BRAIN] Complete. Reasoning:', reasoning);
    
    // ========== PHASE 2: HAND (Image Generation) ==========
    // The Hand executes the blueprint with precise instructions
    
    // Style guide instructions
    let styleInstructions = "";
    if (styleGuideUrl) {
      styleInstructions = `

STYLE REFERENCE: A style guide image is provided. Use this reference for general visual style (lighting setup, composition style, mood, background treatment). 

IMPORTANT - THE BLUEPRINT ABOVE OVERRIDES STYLE GUIDE: If the blueprint specifies different colors, saturation, brightness, contrast, or any other visual adjustments, PRIORITIZE THE BLUEPRINT over the style guide.

DO NOT copy any food from the style reference - use ONLY the food items from the menu photo references.`;
    }
    
    // Resolution quality hint for the model
    const resolutionQuality = resolution === "4K" ? "ultra high definition 4K quality" : (resolution === "2K" ? "high definition 2K quality" : "standard 1K quality");
    
    // Build the final prompt using the Brain's blueprint
    const handPrompt = `EXECUTE THIS PRECISE IMAGE BLUEPRINT:

${blueprint}

TECHNICAL REQUIREMENTS:
- Composition: ${ratioDesc} at ${dimensionString}, ${resolutionQuality}
- Generate at exactly ${width}x${height} pixels resolution
- Keep food items realistically proportioned${styleInstructions}`;
    
    console.log('[HAND] Prompt preview:', handPrompt.substring(0, 400) + '...');

    // Build content array with text and images
    const content: any[] = [{ type: "text", text: handPrompt }];
    
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

    console.log('[HAND] Using Gemini image model with thinkingBudget: 16384');
    console.log('[HAND] Requested photo amount:', photoAmount);
    
    // Generate multiple images if requested
    const numImages = Math.min(Math.max(parseInt(photoAmount) || 1, 1), 4);
    const allGeneratedImages: string[] = [];
    
    for (let imageIndex = 0; imageIndex < numImages; imageIndex++) {
      console.log(`[HAND] Generating image ${imageIndex + 1}/${numImages}`);
      
      // Retry logic for transient errors
      const maxRetries = 3;
      let lastError: Error | null = null;
      let response: Response | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[HAND] Attempt ${attempt}/${maxRetries} for image ${imageIndex + 1}`);
          
          // Use generationConfig.imageConfig for proper resolution control
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
              modalities: ["image", "text"],
              generationConfig: {
                imageConfig: {
                  aspectRatio: ratio,
                  imageSize: resolution
                },
                thinkingConfig: {
                  thinkingBudget: 16384
                }
              }
            }),
          });
          
          // If we get a 5xx error and have retries left, wait and retry
          if (response.status >= 500 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`[HAND] Got ${response.status}, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          break;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`[HAND] Fetch error, retrying in ${waitTime}ms...`, lastError.message);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!response) {
        throw lastError || new Error('Failed to connect to AI gateway after retries');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[HAND] AI gateway error:', response.status, errorText);
        
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
      console.log(`[HAND] AI response received for image ${imageIndex + 1}`);
      
      // Check for error in response body (AI gateway can return 200 with error in body)
      if (data.error) {
        console.error('[HAND] AI returned error in body:', data.error);
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
        console.log(`[HAND] Added ${generatedImages.length} image(s) from generation ${imageIndex + 1}`);
      } else {
        console.error(`[HAND] No images found for generation ${imageIndex + 1}. Full response:`, JSON.stringify(data, null, 2));
      }
    }
    
    if (allGeneratedImages.length === 0) {
      throw new Error('No images generated - try a simpler prompt or fewer reference images');
    }

    console.log('=== GENERATION COMPLETE ===');
    console.log('Brain reasoning:', reasoning);
    console.log('Total images generated:', allGeneratedImages.length);

    return new Response(
      JSON.stringify({ 
        images: allGeneratedImages,
        reasoning // Include reasoning in response for transparency
      }),
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
