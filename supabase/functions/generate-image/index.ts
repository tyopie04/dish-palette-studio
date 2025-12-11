import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Diverse style presets for randomization when no style guide is provided
const stylePresets = [
  {
    name: "Bright & Clean",
    lighting: "soft diffused natural daylight from front-left, minimal harsh shadows",
    background: "clean white or light grey seamless backdrop",
    mood: "fresh, appetizing, bright, modern",
    props: "minimal - perhaps a subtle napkin corner or clean surface",
    colorGrade: "neutral to slightly warm, high key, vibrant food colors"
  },
  {
    name: "Rustic Warmth",
    lighting: "warm golden hour sunlight from side, gentle soft shadows",
    background: "natural weathered wood table or rustic cutting board",
    mood: "cozy, homemade, inviting, artisanal",
    props: "scattered herbs, wooden utensils, burlap texture",
    colorGrade: "warm tones, earthy browns, golden highlights"
  },
  {
    name: "Bold & Vibrant",
    lighting: "bright even studio lighting with slight rim light for pop",
    background: "bold solid color backdrop (red, yellow, or teal)",
    mood: "energetic, fun, eye-catching, punchy",
    props: "colorful ingredients, dynamic sauce splashes",
    colorGrade: "high saturation, vivid colors, strong contrast"
  },
  {
    name: "Minimalist Modern",
    lighting: "soft even studio lighting, clean shadows",
    background: "solid matte color (soft grey, pale pink, or sage green)",
    mood: "elegant, sophisticated, clean, contemporary",
    props: "none or single geometric element",
    colorGrade: "slightly desaturated, pastel tones, muted elegance"
  },
  {
    name: "Dark & Dramatic",
    lighting: "dramatic side lighting with deep shadows, single key light",
    background: "dark slate, black marble, or charcoal surface",
    mood: "luxurious, moody, premium, sophisticated",
    props: "dark plates, slate boards, dramatic steam",
    colorGrade: "low key, rich shadows, selective highlights on food"
  },
  {
    name: "Fresh & Natural",
    lighting: "bright natural window light, airy and fresh",
    background: "white marble surface or light linen cloth",
    mood: "healthy, fresh, organic, light",
    props: "fresh herbs, citrus slices, scattered seeds",
    colorGrade: "bright, clean whites, natural greens, fresh appearance"
  },
  {
    name: "Retro Diner",
    lighting: "warm tungsten-style lighting, nostalgic glow",
    background: "checkered pattern, red booth leather, or retro tile",
    mood: "nostalgic, fun, classic American, cheerful",
    props: "vintage plates, ketchup bottles, napkin dispensers",
    colorGrade: "warm vintage tones, slightly faded reds and yellows"
  },
  {
    name: "Industrial Chic",
    lighting: "cool directional light with hard shadows",
    background: "concrete surface, metal tray, or brushed steel",
    mood: "urban, edgy, contemporary, trendy",
    props: "geometric elements, metal utensils",
    colorGrade: "cool tones, desaturated background, food colors pop"
  }
];

// Get a random style preset
function getRandomStylePreset(): typeof stylePresets[0] {
  const index = Math.floor(Math.random() * stylePresets.length);
  return stylePresets[index];
}

// Brain: Gemini 2.5 Pro for reasoning and blueprint creation (MULTIMODAL)
async function createImageBlueprint(
  LOVABLE_API_KEY: string,
  userPrompt: string,
  ratio: string,
  resolution: string,
  dimensionString: string,
  photoNames: string[],
  hasStyleGuide: boolean,
  selectedStyle: typeof stylePresets[0] | null,
  imageUrls?: string[],
  styleGuideUrl?: string
): Promise<{ blueprint: string; reasoning: string; styleName: string }> {
  
  const randomSeed = Math.random().toString(36).substring(2, 15);
  
  // Build style instructions based on whether we have a style guide or a preset
  let styleSection = "";
  if (hasStyleGuide) {
    styleSection = `
STYLE GUIDE PROVIDED - Extract style AND composition elements from the style guide image:
- Analyze the lighting setup, color grading, background treatment, and overall mood
- ALSO extract the CAMERA ANGLE and COMPOSITION (e.g., if food is being eaten, held, viewed from above)
- Apply these style AND angle elements to the food photography
- The INGREDIENTS come from the menu photos, but the ANGLE/POSE comes from the style guide
- Do NOT copy any food from the style guide - only the visual style and composition`;
  } else if (selectedStyle) {
    styleSection = `
MANDATORY STYLE PRESET - YOU MUST USE THIS EXACT STYLE:
Style Name: ${selectedStyle.name}
- Lighting: ${selectedStyle.lighting}
- Background: ${selectedStyle.background}
- Mood: ${selectedStyle.mood}
- Props: ${selectedStyle.props}
- Color Grade: ${selectedStyle.colorGrade}

⚠️ CRITICAL: You MUST apply this "${selectedStyle.name}" style. Do NOT default to dark/moody aesthetics unless that is the selected style. Do NOT derive any style from logos or brand assets.`;
  }
  
  const systemPrompt = `You are an expert food photography art director. Your job is to create STAGING INSTRUCTIONS for an AI that will PHOTOGRAPH the EXACT food INGREDIENTS from the reference images.

⚠️ CRITICAL - FALSE ADVERTISING PREVENTION ⚠️
The reference food photos show REAL MENU ITEMS that will be sold to customers. The generated image MUST show the EXACT SAME FOOD INGREDIENTS - same bun type, same patties, same ingredients, same toppings, same cheese. 

YOU ARE NOT CREATING NEW FOOD - you are directing a PHOTO SHOOT of the EXISTING food items.

Think of it like this: The food is already cooked and plated. You are the photographer choosing:
- Camera angle and perspective
- Lighting setup  
- Background
- Arrangement/composition
- Props and styling
- How the food is held or positioned

YOU CANNOT CHANGE (the INGREDIENTS):
- The food ingredients (bun type, patty count, toppings, cheese type)
- The sauce type and placement
- Any identifying food characteristics

YOU CAN (AND SHOULD) CHANGE TO MATCH STYLE GUIDE:
- Camera angle and perspective (front, side, top-down, eating angle, etc.)
- How the food is positioned or held in the scene
- Lighting direction and quality
- Background and environment

${styleSection}

=== CHAIN-OF-THOUGHT ANALYSIS ===

STEP 1 - IDENTIFY EXACT FOOD ITEMS:
For each reference photo, catalog the EXACT details:
- Bun type and color (sesame, brioche, pretzel, plain - note exact shade)
- Number of patties and their appearance (thickness, char marks, color)
- Exact toppings in order from top to bottom
- Cheese type and melt pattern
- Sauce visibility and placement
- Any unique identifying features

STEP 2 - APPLY THE SPECIFIED STYLE:
Use the ${hasStyleGuide ? "style guide image" : selectedStyle ? `"${selectedStyle.name}" preset` : "default"} to determine:
- Lighting direction, warmth, and shadow quality
- Background surface/color
- Overall color grading and mood
- Composition approach

=== INPUT CONTEXT ===
- Aspect ratio: ${ratio}
- Resolution: ${dimensionString}
- Reference food photos: ${imageUrls?.length || 0}
- Style: ${hasStyleGuide ? 'From style guide image' : selectedStyle?.name || 'Default'}
- Variation seed: ${randomSeed}

=== OUTPUT FORMAT ===
{
  "visualAnalysis": {
    "foodItems": ["EXACT description of each item - be specific about bun type, patty count, exact toppings, cheese type"],
    "identifyingFeatures": ["Unique characteristics that MUST be preserved"],
    "textures": ["Surface textures to preserve"],
    "colors": ["Exact colors to match"]
  },
  "styleApplication": "How you are applying the ${hasStyleGuide ? 'style guide' : selectedStyle?.name || 'default'} style",
  "compositionPlan": "Camera angle, arrangement, background based on style",
  "reasoning": "Your creative decisions for styling within the specified style",
  "imagePrompt": "CRITICAL: This prompt must:
    1. REPRODUCE the EXACT food items from the reference photos
    2. Apply the ${hasStyleGuide ? 'style guide' : selectedStyle?.name || 'default'} style for lighting/background/mood
    3. Include detailed food characteristics that must be preserved
    4. NOT describe generic food - describe THE SPECIFIC items from the references"
}

=== RULES ===
1. The food in the output MUST be visually identical to the reference photos
2. ONLY lighting, angle, background, and composition can change
3. You MUST use the specified style - do not default to dark/moody if another style is specified
4. Include the variation seed ${randomSeed} for unique outputs`;

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
  
  // Add menu photo references for the Brain to SEE (limit to 6 to prevent memory issues)
  const MAX_BRAIN_IMAGES = 6;
  if (imageUrls && imageUrls.length > 0) {
    const imagesToProcess = imageUrls.slice(0, MAX_BRAIN_IMAGES);
    console.log('[BRAIN] Adding', imagesToProcess.length, 'of', imageUrls.length, 'reference images for visual analysis');
    if (imageUrls.length > MAX_BRAIN_IMAGES) {
      console.log('[BRAIN] Note: Limited to', MAX_BRAIN_IMAGES, 'images to prevent memory overflow');
    }
    for (const url of imagesToProcess) {
      brainContent.push({
        type: "image_url",
        image_url: { url }
      });
    }
  }
  
  // Retry logic for transient errors (502, 503, 504)
  let response: Response | null = null;
  const maxRetries = 3;
  const retryableStatuses = [502, 503, 504];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

      if (response.ok) {
        break; // Success, exit retry loop
      }

      if (retryableStatuses.includes(response.status) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`[BRAIN] Attempt ${attempt} failed with ${response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error or final attempt
      const errorText = await response.text();
      console.error('[BRAIN] Error:', response.status, errorText);
      throw new Error(`Brain reasoning failed: ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[BRAIN] Attempt ${attempt} failed with network error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (!response || !response.ok) {
    throw new Error('Brain reasoning failed after all retries');
  }

  const data = await response.json();
  console.log('[BRAIN] Full response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
  
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    // Log more details to debug empty response
    console.error('[BRAIN] Empty response. Full data:', JSON.stringify(data));
    console.error('[BRAIN] Choices:', JSON.stringify(data.choices));
    
    // Check if there's an error in the response
    if (data.error) {
      throw new Error(`Brain error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    // Check for finish_reason that might indicate an issue
    const finishReason = data.choices?.[0]?.finish_reason;
    if (finishReason && finishReason !== 'stop') {
      throw new Error(`Brain stopped unexpectedly: ${finishReason}`);
    }
    
    throw new Error('Brain returned empty response - check logs for details');
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
      reasoning: parsed.reasoning || 'No reasoning provided',
      styleName: selectedStyle?.name || (hasStyleGuide ? 'Style Guide' : 'Default')
    };
  } catch (parseError) {
    console.log('[BRAIN] Could not parse as JSON, using raw content as blueprint');
    return {
      blueprint: content,
      reasoning: 'Direct prompt interpretation',
      styleName: selectedStyle?.name || (hasStyleGuide ? 'Style Guide' : 'Default')
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
    
    // Select a random style preset if no style guide is provided
    const selectedStyle = !styleGuideUrl ? getRandomStylePreset() : null;
    
    console.log('=== BRAIN + HAND ARCHITECTURE ===');
    console.log('Target resolution:', dimensionString);
    console.log('Number of menu photos:', imageUrls?.length || 0);
    console.log('Photo names:', photoNames?.join(', ') || 'None');
    console.log('Style guide provided:', !!styleGuideUrl);
    console.log('Selected style preset:', selectedStyle?.name || 'Using style guide');

    // ========== PHASE 1: BRAIN (Gemini 2.5 Pro - MULTIMODAL) ==========
    // The Brain SEES the actual images and creates a detailed blueprint
    const { blueprint, reasoning, styleName } = await createImageBlueprint(
      LOVABLE_API_KEY,
      prompt || 'Create a professional food photography advertisement.',
      ratio,
      resolution,
      dimensionString,
      photoNames || [],
      !!styleGuideUrl,
      selectedStyle,
      imageUrls,
      styleGuideUrl
    );
    
    console.log('[BRAIN] Applied style:', styleName);
    
    console.log('[BRAIN] Complete. Reasoning:', reasoning);
    
    // ========== PHASE 2: HAND (Image Generation) ==========
    // The Hand executes the blueprint with precise instructions
    
    // Style instructions for the Hand
    let styleInstructions = "";
    if (styleGuideUrl) {
      styleInstructions = `

STYLE REFERENCE IMAGE PROVIDED:
- Use the style guide for: lighting setup, color grading, background style, mood, CAMERA ANGLE, COMPOSITION, and POSE
- Match the perspective/angle shown in the style guide (e.g., if someone is eating, show the food at that eating angle)
- ⚠️ The INGREDIENTS from the menu photo must be preserved - but the VIEWING ANGLE should match the style guide
- If the style guide shows food being held/eaten, position the menu item food the same way
- The style guide shows the AESTHETIC and COMPOSITION to recreate with the menu item food`;
    } else if (selectedStyle) {
      styleInstructions = `

MANDATORY STYLE: "${selectedStyle.name}"
- Lighting: ${selectedStyle.lighting}
- Background: ${selectedStyle.background}
- Mood: ${selectedStyle.mood}
- Props: ${selectedStyle.props}
- Color Grade: ${selectedStyle.colorGrade}

⚠️ You MUST use this "${selectedStyle.name}" style exactly as specified. Do NOT default to dark/moody aesthetics unless that is the specified style.`;
    }
    
    // Resolution quality hint for the model
    const resolutionQuality = resolution === "4K" ? "ultra high definition 4K quality" : (resolution === "2K" ? "high definition 2K quality" : "standard 1K quality");
    
    console.log('[HAND] Using Gemini image model with thinkingBudget: 16384');
    console.log('[HAND] Requested photo amount:', photoAmount);
    
    // Generate multiple images if requested
    const numImages = Math.min(Math.max(parseInt(photoAmount) || 1, 1), 4);
    const allGeneratedImages: string[] = [];
    
    for (let imageIndex = 0; imageIndex < numImages; imageIndex++) {
      console.log(`[HAND] Generating image ${imageIndex + 1}/${numImages}`);
      
      // Generate unique variation seed for THIS image
      const variationSeed = Math.random().toString(36).substring(2, 10);
      console.log(`[HAND] Variation seed for image ${imageIndex + 1}: ${variationSeed}`);
      
      // Build the final prompt for THIS image with unique seed
      const handPrompt = `⚠️ CRITICAL INSTRUCTION - READ CAREFULLY ⚠️

You MUST REPRODUCE the EXACT food INGREDIENTS from the reference photos. This is for commercial advertising.

WHAT "VISUALLY IDENTICAL" MEANS (the INGREDIENTS):
✅ Same bun type (sesame, brioche, potato, etc.)
✅ Same number of patties and their appearance
✅ Same toppings, cheese type, and sauce
✅ Same overall food construction and ingredients

WHAT CAN (AND SHOULD) CHANGE TO MATCH THE STYLE GUIDE:
✅ Camera angle and perspective (front, side, top-down, eating angle)
✅ How the food is held or positioned in the scene
✅ Lighting direction and quality
✅ Background and environment

If a style guide shows someone EATING the food, show it at that eating angle.
If a style guide shows a top-down view, use that angle.
If a style guide shows food being held in hands, show the menu item held that way.
The INGREDIENTS stay the same, but the ANGLE and COMPOSITION match the style guide.

WHAT YOU MUST NOT DO:
❌ Do NOT change the bun type, patty count, toppings, or cheese
❌ Do NOT create different food items than shown in the reference
❌ Do NOT generate generic food - use the EXACT ingredients from the reference

BLUEPRINT FOR STYLING (apply to the EXACT food INGREDIENTS from references):
${blueprint}

TECHNICAL REQUIREMENTS:
- Composition: ${ratioDesc} at ${dimensionString}, ${resolutionQuality}
- Resolution: ${width}x${height} pixels
- Variation seed for unique output: ${variationSeed}
- Image variation number: ${imageIndex + 1} of ${numImages}${styleInstructions}

REMEMBER: The reference photos show the REAL MENU ITEMS. Photograph them from the angle/composition shown in the style guide.`;
      
      if (imageIndex === 0) {
        console.log('[HAND] Prompt preview:', handPrompt.substring(0, 400) + '...');
      }

      // Build content array for THIS image
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
