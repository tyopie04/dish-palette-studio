import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brain: Gemini 2.5 Pro for reasoning and blueprint creation (MULTIMODAL)
async function createImageBlueprint(
  LOVABLE_API_KEY: string,
  userPrompt: string,
  ratio: string,
  resolution: string,
  dimensionString: string,
  photoNames: string[],
  hasStyleGuide: boolean,
  imageUrls?: string[],      // Actual menu photo URLs for visual analysis
  styleGuideUrl?: string     // Style guide image URL
): Promise<{ blueprint: string; reasoning: string }> {
  
  const systemPrompt = `You are an expert food photography art director with 20+ years experience in commercial food advertising. Your job is to VISUALLY ANALYZE the provided reference photos and create a precise, detailed blueprint for an AI image generator.

CRITICAL: You MUST describe the ACTUAL FOOD you see in the reference images. DO NOT rely on text names or labels - they may be inaccurate. Look at the images and describe what you actually see.

=== CHAIN-OF-THOUGHT ANALYSIS STEPS ===

STEP 1 - VISUAL IDENTIFICATION:
For each reference photo, identify:
- What type of food is this ACTUALLY? (burger, sandwich, steak, salad, etc.)
- Key distinguishing features (number of patties, type of bun, visible toppings)
- Any unique characteristics that make this item special

STEP 2 - TEXTURE & COLOR ANALYSIS:
Describe in detail:
- Surface textures (crispy, glossy, matte, charred, melted)
- Color palette (golden brown, vibrant green, deep red, etc.)
- Ingredient layers and their visual order

STEP 3 - STYLE GUIDE ANALYSIS (if provided):
Extract from style guide:
- Lighting setup (direction, softness, color temperature)
- Background treatment (color, texture, gradient)
- Overall mood and atmosphere
- Any branding elements or text treatments

STEP 4 - COMPOSITION PLANNING:
Using professional food photography principles:
- Rule of thirds placement for hero items
- Visual hierarchy (what draws the eye first)
- Negative space usage
- Depth and layering

STEP 5 - FOOD PHOTOGRAPHY BEST PRACTICES:
Consider adding:
- Steam rising from hot items (indicates freshness)
- Sauce drips and cheese pulls (creates appetite appeal)
- Condensation on cold items
- Crumb trails and ingredient "hero" positioning
- Garnish placement for color contrast

=== INPUT CONTEXT ===
- Aspect ratio: ${ratio}
- Resolution: ${dimensionString}
- Number of reference food photos: ${imageUrls?.length || 0}
- Style guide provided: ${hasStyleGuide ? 'Yes - use it for lighting, mood, and composition style' : 'No'}

=== OUTPUT FORMAT ===
Your response MUST be a JSON object with this structure:
{
  "visualAnalysis": {
    "foodItems": ["Detailed description of each food item you ACTUALLY SEE"],
    "textures": ["List of key textures: crispy, melted, glossy, etc."],
    "colors": ["Dominant colors: golden brown, vibrant red, etc."]
  },
  "styleGuideAnalysis": "What lighting/mood/composition cues to take from the style guide (or 'N/A' if none provided)",
  "compositionPlan": "How you will arrange the items using rule of thirds, visual hierarchy, and professional food photography techniques",
  "reasoning": "Brief explanation of your creative decisions (2-3 sentences)",
  "imagePrompt": "The complete, ultra-detailed prompt for the image generator. Include:
    - EXACT food descriptions based on YOUR visual analysis (NOT text labels)
    - Precise positioning (center-left, lower third, etc.)
    - Lighting: direction, quality, color temperature, shadows
    - Background: exact color, texture, any gradients
    - Camera: angle, lens type, depth of field
    - Hero details: steam, sauce drips, cheese pulls, glistening highlights
    - Text/graphics if requested
    - Mood and atmosphere"
}

=== RULES ===
1. ALWAYS describe actual food you SEE - ignore misleading text labels
2. ALWAYS prioritize user's explicit requests over assumptions
3. If user specifies colors/lighting/mood - use EXACTLY what they specify
4. Be precise about spatial relationships
5. The imagePrompt must be self-contained (image generator won't see original request)
6. Include appetizing details: steam, drips, glistening, texture contrast`;

  console.log('[BRAIN] Calling Gemini 2.5 Pro for MULTIMODAL reasoning with enhanced thinking...');
  console.log('[BRAIN] Reference images to analyze:', imageUrls?.length || 0);
  console.log('[BRAIN] Style guide provided:', !!styleGuideUrl);
  
  // Build multimodal content array
  const brainContent: any[] = [{ type: "text", text: userPrompt }];
  
  // Add style guide first if provided (for visual style reference)
  if (styleGuideUrl) {
    console.log('[BRAIN] Adding style guide image for visual analysis');
    brainContent.push({
      type: "image_url",
      image_url: { url: styleGuideUrl }
    });
  }
  
  // Add ALL menu photo references for the Brain to SEE
  if (imageUrls && imageUrls.length > 0) {
    console.log('[BRAIN] Adding', imageUrls.length, 'reference images for visual analysis');
    for (const url of imageUrls) {
      brainContent.push({
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
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: brainContent }
      ],
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 24576  // High thinking budget for detailed analysis
        }
      }
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
    
    // Log the enhanced analysis details
    if (parsed.visualAnalysis) {
      console.log('[BRAIN] Visual Analysis - Food Items:', parsed.visualAnalysis.foodItems?.join(', ') || 'N/A');
      console.log('[BRAIN] Visual Analysis - Textures:', parsed.visualAnalysis.textures?.join(', ') || 'N/A');
      console.log('[BRAIN] Visual Analysis - Colors:', parsed.visualAnalysis.colors?.join(', ') || 'N/A');
    }
    if (parsed.styleGuideAnalysis) {
      console.log('[BRAIN] Style Guide Analysis:', parsed.styleGuideAnalysis.substring(0, 200) + '...');
    }
    if (parsed.compositionPlan) {
      console.log('[BRAIN] Composition Plan:', parsed.compositionPlan.substring(0, 200) + '...');
    }
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

    // ========== PHASE 1: BRAIN (Gemini 2.5 Pro - MULTIMODAL) ==========
    // The Brain SEES the actual images and creates a detailed blueprint
    const { blueprint, reasoning } = await createImageBlueprint(
      LOVABLE_API_KEY,
      prompt || 'Create a professional food photography advertisement.',
      ratio,
      resolution,
      dimensionString,
      photoNames || [],
      !!styleGuideUrl,
      imageUrls,      // Pass actual images to Brain
      styleGuideUrl   // Pass style guide to Brain
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
