import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Helper function to extract image dimensions from base64 PNG/JPEG
function getImageDimensions(base64Data: string): { width: number; height: number } | null {
  try {
    // Extract the actual base64 content (remove data URL prefix if present)
    let base64Content = base64Data;
    const base64Match = base64Data.match(/base64,(.+)/);
    if (base64Match) {
      base64Content = base64Match[1];
    }
    
    const bytes = decodeBase64(base64Content);
    
    // Check for PNG signature (89 50 4E 47 0D 0A 1A 0A)
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      // PNG: Width is at bytes 16-19, Height at bytes 20-23 (big-endian)
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width, height };
    }
    
    // Check for JPEG signature (FF D8 FF)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      // JPEG: Need to find SOF marker (Start of Frame)
      let i = 2;
      while (i < bytes.length - 8) {
        if (bytes[i] !== 0xFF) { i++; continue; }
        const marker = bytes[i + 1];
        // SOF0, SOF1, SOF2 markers contain dimensions
        if (marker >= 0xC0 && marker <= 0xC2) {
          const height = (bytes[i + 5] << 8) | bytes[i + 6];
          const width = (bytes[i + 7] << 8) | bytes[i + 8];
          return { width, height };
        }
        // Skip to next marker
        const length = (bytes[i + 2] << 8) | bytes[i + 3];
        i += 2 + length;
      }
    }
    
    // Check for WebP signature (RIFF....WEBP)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      // WebP: VP8 chunk contains dimensions at specific offsets
      // This is simplified - may need enhancement for VP8L/VP8X
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38) {
        // VP8 bitstream
        const width = ((bytes[26] | (bytes[27] << 8)) & 0x3FFF);
        const height = ((bytes[28] | (bytes[29] << 8)) & 0x3FFF);
        if (width > 0 && height > 0) return { width, height };
      }
    }
    
    return null;
  } catch (e) {
    console.error('[DIMENSION] Error extracting dimensions:', e);
    return null;
  }
}

// Upscale an image using Gemini
async function upscaleImage(
  LOVABLE_API_KEY: string,
  imageBase64: string,
  targetWidth: number,
  targetHeight: number,
  currentWidth: number,
  currentHeight: number
): Promise<string> {
  console.log(`[UPSCALE] Upscaling from ${currentWidth}x${currentHeight} to ${targetWidth}x${targetHeight}`);
  
  const upscalePrompt = `CRITICAL UPSCALING TASK:

You MUST upscale this image to EXACTLY ${targetWidth}x${targetHeight} pixels.

RULES:
1. The output MUST be EXACTLY ${targetWidth}x${targetHeight} pixels - no exceptions
2. Preserve ALL details, textures, colors, and composition exactly as they are
3. Enhance sharpness and detail appropriate for the higher resolution
4. Do NOT change, add, or remove any content from the image
5. Do NOT alter colors, lighting, or any visual elements
6. Simply make this exact image larger at ${targetWidth}x${targetHeight} pixels

This is a pure resolution upscale. The content must be identical, just at higher resolution.
Output resolution: ${targetWidth}x${targetHeight} pixels.`;

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
          content: [
            { type: "text", text: upscalePrompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      modalities: ["image", "text"],
      size: `${targetWidth}x${targetHeight}`,
      generationConfig: {
        imageConfig: {
          width: targetWidth,
          height: targetHeight
        },
        thinkingConfig: {
          thinkingBudget: 4096
        }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[UPSCALE] Error:', response.status, errorText);
    throw new Error(`Upscaling failed: ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  
  // Extract the upscaled image
  if (message?.images && message.images.length > 0) {
    const upscaledUrl = message.images[0].image_url?.url || message.images[0].url;
    if (upscaledUrl) {
      console.log('[UPSCALE] Successfully upscaled image');
      return upscaledUrl;
    }
  }
  
  // Check for inline image in content
  if (message?.content) {
    const base64Match = message.content.match(/data:image\/[^;]+;base64,[^\s"]+/);
    if (base64Match) {
      console.log('[UPSCALE] Successfully upscaled image (from content)');
      return base64Match[0];
    }
  }
  
  throw new Error('Upscaling returned no image');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Menu category keywords mapping for smart photo selection
const categoryKeywords: Record<string, string[]> = {
  "Chicken": ["chicken", "chicken burger", "chicken burgers", "poultry"],
  "Beef": ["beef", "beef burger", "beef burgers"],
  "Off Menu": ["off menu", "off-menu", "special", "specials", "secret menu"],
  "Sides": ["sides", "fries", "chips", "tenders", "wings", "side"],
  "Drinks - Arizona": ["arizona", "arizona tea", "arizona drink"],
  "Drinks - Calypso": ["calypso", "calypso drink", "lemonade"],
  "Drinks - Sodas": ["soda", "sodas", "coke", "dr pepper", "fanta", "jarritos", "soft drink", "soft drinks"],
  "Shakes": ["shake", "shakes", "milkshake", "milkshakes"],
};

// General category groups for broader matching
const categoryGroups: Record<string, string[]> = {
  "burgers": ["Chicken", "Beef", "Off Menu"],
  "all burgers": ["Chicken", "Beef", "Off Menu"],
  "drinks": ["Drinks - Arizona", "Drinks - Calypso", "Drinks - Sodas"],
  "all drinks": ["Drinks - Arizona", "Drinks - Calypso", "Drinks - Sodas"],
  "beverages": ["Drinks - Arizona", "Drinks - Calypso", "Drinks - Sodas", "Shakes"],
};

// Parse prompt to extract category references
function parsePromptForCategories(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const matchedCategories: Set<string> = new Set();
  
  // Check for group keywords first (more specific)
  for (const [groupKeyword, categories] of Object.entries(categoryGroups)) {
    if (lowerPrompt.includes(groupKeyword)) {
      categories.forEach(cat => matchedCategories.add(cat));
    }
  }
  
  // Check for specific category keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        matchedCategories.add(category);
        break;
      }
    }
  }
  
  return Array.from(matchedCategories);
}

// Fetch photos from database by categories
async function fetchPhotosByCategories(categories: string[], userId: string): Promise<{ urls: string[], names: string[] }> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[AUTO-SELECT] Supabase credentials not available');
    return { urls: [], names: [] };
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('menu_photos')
    .select('name, original_url, category')
    .eq('user_id', userId)
    .in('category', categories)
    .order('display_order');
    
  if (error) {
    console.error('[AUTO-SELECT] Database error:', error);
    return { urls: [], names: [] };
  }
  
  if (!data || data.length === 0) {
    console.log('[AUTO-SELECT] No photos found for categories:', categories);
    return { urls: [], names: [] };
  }
  
  console.log('[AUTO-SELECT] Found', data.length, 'photos for categories:', categories);
  
  return {
    urls: data.map(p => p.original_url),
    names: data.map(p => p.name)
  };
}

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
  
  const systemPrompt = `You are an expert food photography art director. Your PRIMARY TASK is to execute the USER'S CREATIVE DIRECTION while photographing real menu items.

=== 🎯 PRIORITY #1: USER'S CREATIVE DIRECTION ===
The user's prompt is your MAIN INSTRUCTION. Execute it precisely:
- If they say "top-down" → shoot from DIRECTLY ABOVE (burgers appear as circles, you see the top of buns)
- If they say "2700K lighting" → use WARM tungsten-style lighting at that color temperature
- If they say "table spread" → arrange ALL items on a table surface
- If they say "action shot" → show food being eaten, held, or in motion
- INTERPRET the angle literally. A "top-down shot of a burger" means you see a CIRCLE (the top of the bun), NOT a side view.

=== 🎯 PRIORITY #2: INCLUDE ALL ${imageUrls?.length || 0} REFERENCE ITEMS ===
⚠️ MANDATORY: You have EXACTLY ${imageUrls?.length || 0} reference food items provided.
You MUST include ALL ${imageUrls?.length || 0} items in your generated image.
ITEMS TO INCLUDE: ${photoNames?.join(', ') || 'See reference images'}

Before generating, mentally verify: "I am including [item 1], [item 2], [item 3]..." for all ${imageUrls?.length || 0} items.
MISSING ANY ITEM IS A FAILURE.

=== 🎯 PRIORITY #3: PRESERVE FOOD INGREDIENTS ===
The reference photos show REAL MENU ITEMS. Preserve these characteristics:
- Same bun type (sesame, brioche, potato, etc.)
- Same number of patties and toppings
- Same cheese type and sauce placement
- Same identifying food characteristics

Think of it like this: You are RE-PHOTOGRAPHING existing food from a NEW ANGLE specified by the user.

=== WHAT YOU CONTROL (THE PHOTOGRAPHY) ===
✅ Camera angle (as specified by user's prompt)
✅ Lighting direction, warmth, and quality
✅ Background and environment
✅ Composition and arrangement
✅ How food is positioned in the scene

=== WHAT STAYS FIXED (THE FOOD ITSELF) ===
❌ Bun type, patty count, toppings, cheese type
❌ Sauce type and placement
❌ Food construction and ingredients

${styleSection}

=== INPUT CONTEXT ===
- User's creative direction: "${userPrompt}"
- Aspect ratio: ${ratio}
- Resolution: ${dimensionString}
- Number of reference food items: ${imageUrls?.length || 0} (INCLUDE ALL)
- Menu item names: ${photoNames?.join(', ') || 'None specified'}
- Style: ${hasStyleGuide ? 'From style guide image' : selectedStyle?.name || 'Default'}
- Variation seed: ${randomSeed}

=== OUTPUT FORMAT (JSON) ===
{
  "visualAnalysis": {
    "foodItems": ["Detailed description of each reference item's ingredients - be SPECIFIC about bun type, patty count, exact toppings"],
    "identifyingFeatures": ["Unique characteristics to preserve"],
    "textures": ["Surface textures visible"],
    "colors": ["Exact colors to maintain"]
  },
  "userDirectionInterpretation": "How I will execute the user's '${userPrompt}' instruction - specifically the camera angle and lighting",
  "angleTransformation": "How the food will appear from the requested angle (e.g., 'top-down means burgers appear as circles showing top of buns')",
  "itemInclusionPlan": "Confirming I will include all ${imageUrls?.length || 0} items: ${photoNames?.join(', ') || 'all reference items'}",
  "styleApplication": "How I'm applying the ${hasStyleGuide ? 'style guide' : selectedStyle?.name || 'default'} style",
  "reasoning": "My creative decisions for this shoot",
  "imagePrompt": "Detailed generation prompt that:
    1. EXECUTES the user's angle/lighting direction as the primary focus
    2. INCLUDES all ${imageUrls?.length || 0} reference items
    3. PRESERVES exact food ingredients from references
    4. Describes food as seen FROM THE REQUESTED ANGLE"
}

=== CRITICAL REMINDERS ===
1. USER'S PROMPT IS YOUR MAIN TASK - execute their creative direction
2. ALL ${imageUrls?.length || 0} ITEMS must appear in the generated image
3. Food ingredients stay identical, only photography changes
4. Include variation seed ${randomSeed} for unique outputs`;

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
  
  // Add menu photo references for the Brain to SEE (limit to 10 to prevent memory issues)
  const MAX_BRAIN_IMAGES = 10;
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
    const { prompt, ratio, resolution, photoAmount = 1, imageUrls: providedImageUrls, photoNames: providedPhotoNames, styleGuideUrl, autoSelectPhotos = false, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // Smart photo selection: if autoSelectPhotos is enabled OR no photos provided but prompt has category keywords
    let imageUrls = providedImageUrls || [];
    let photoNames = providedPhotoNames || [];
    
    const hasProvidedPhotos = imageUrls.length > 0;
    const promptCategories = parsePromptForCategories(prompt || '');
    
    console.log('[AUTO-SELECT] Prompt categories detected:', promptCategories);
    console.log('[AUTO-SELECT] Has provided photos:', hasProvidedPhotos);
    console.log('[AUTO-SELECT] Auto-select enabled:', autoSelectPhotos);
    
    // Auto-select photos if: explicitly enabled OR (no photos provided AND prompt has category keywords)
    if ((autoSelectPhotos || !hasProvidedPhotos) && promptCategories.length > 0 && userId) {
      console.log('[AUTO-SELECT] Fetching photos for categories:', promptCategories);
      const autoPhotos = await fetchPhotosByCategories(promptCategories, userId);
      
      if (autoPhotos.urls.length > 0) {
        // If photos were already provided, merge them
        if (hasProvidedPhotos) {
          imageUrls = [...imageUrls, ...autoPhotos.urls];
          photoNames = [...photoNames, ...autoPhotos.names];
        } else {
          imageUrls = autoPhotos.urls;
          photoNames = autoPhotos.names;
        }
        console.log('[AUTO-SELECT] Using', imageUrls.length, 'photos:', photoNames.join(', '));
      }
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
    
    // Select a random style preset ONLY if no style guide AND no custom prompt
    const hasCustomPrompt = prompt && prompt.trim().length > 0;
    const selectedStyle = (!styleGuideUrl && !hasCustomPrompt) ? getRandomStylePreset() : null;
    
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
    
    // Resolution quality hint for the model - more explicit
    const resolutionQuality = resolution === "4K" 
      ? `ultra high definition 4K quality (${width}x${height} pixels, extremely sharp and detailed)` 
      : (resolution === "2K" 
        ? `high definition 2K quality (${width}x${height} pixels, sharp and detailed)` 
        : `standard 1K quality (${width}x${height} pixels)`);
    
    console.log('[HAND] Using Gemini image model with thinkingBudget: 16384');
    console.log('[HAND] Requested photo amount:', photoAmount);
    console.log('[HAND] Target resolution:', resolution, `(${width}x${height} pixels)`);
    
    // Generate multiple images if requested
    const numImages = Math.min(Math.max(parseInt(photoAmount) || 1, 1), 4);
    
    // Skip upscaling when generating multiple images to avoid timeout
    const shouldUpscale = numImages === 1 && (resolution === "2K" || resolution === "4K");
    console.log('[HAND] Upscaling enabled:', shouldUpscale, '(only for single image 2K/4K)');
    
    // Helper function to generate a single image
    const generateSingleImage = async (imageIndex: number): Promise<string | null> => {
      console.log(`[HAND] Generating image ${imageIndex + 1}/${numImages}`);
      
      // Generate unique variation seed for THIS image
      const variationSeed = Math.random().toString(36).substring(2, 10);
      console.log(`[HAND] Variation seed for image ${imageIndex + 1}: ${variationSeed}`);
      
      // Define variation instructions for each image to ensure diversity
      const variationStyles = [
        "Use WARM golden hour lighting.",
        "Use COOL studio lighting with shallow depth of field.",
        "Use SOFT diffused natural light.",
        "Use MOODY dramatic shadows and rim lighting."
      ];
      
      const variationInstruction = numImages > 1 
        ? `\n\n🎨 VARIATION #${imageIndex + 1} LIGHTING STYLE:\n${variationStyles[imageIndex % variationStyles.length]}\nThis variation MUST look distinctly different from other variations while keeping the SAME food ingredients.`
        : "";
      
      // Build the final prompt for THIS image with unique seed
      const handPrompt = `🎯 YOUR PRIMARY TASK: Execute the user's creative direction while photographing real menu items.

=== STEP 1: EXECUTE USER'S CREATIVE DIRECTION ===
The user requested: "${prompt || 'Professional food photography'}"

INTERPRET THIS LITERALLY:
- "top-down" = Camera DIRECTLY ABOVE looking down (burgers appear as CIRCLES - you see tops of buns, not sides)
- "2700K lighting" = Warm tungsten/amber lighting at 2700 Kelvin color temperature
- "table spread" = All items arranged on a table surface, shot from above or slight angle
- "45-degree angle" = Camera at 45 degrees to the food
- "action shot" = Food being eaten, held, or in motion

The food items from reference photos must be RE-PHOTOGRAPHED from YOUR REQUESTED ANGLE.
If you asked for top-down, a burger should look like a circle (top of bun visible), NOT a side product shot.

=== STEP 2: INCLUDE ALL ${imageUrls?.length || 0} ITEMS ===
⚠️ MANDATORY: You have ${imageUrls?.length || 0} reference food items.
You MUST include ALL ${imageUrls?.length || 0} items in this image. Count them. Include them all.
Do NOT skip or omit any items. Missing items = FAILURE.

=== STEP 3: PRESERVE FOOD INGREDIENTS ===
Keep the same bun type, patty count, toppings, cheese, and sauce from each reference photo.
Only the PHOTOGRAPHY changes (angle, lighting, background), not the FOOD ITSELF.

=== BLUEPRINT FROM ART DIRECTOR ===
${blueprint}${variationInstruction}

=== TECHNICAL SPECS ===
- Resolution: ${width}x${height} pixels (${resolution})
- Aspect ratio: ${ratioDesc} (${ratio})
- Quality: ${resolutionQuality}
- Variation seed: ${variationSeed}
- Image ${imageIndex + 1} of ${numImages}${styleInstructions}

=== FINAL CHECKLIST ===
✅ Am I using the ANGLE requested by the user? (top-down = looking straight down)
✅ Am I including ALL ${imageUrls?.length || 0} reference items?
✅ Am I preserving exact food ingredients from each reference?
✅ Am I applying the correct lighting as specified?

Generate a ${resolution} quality food photograph that executes the user's vision.`;
      
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
      
      // Add all menu photo references
      if (imageUrls && imageUrls.length > 0) {
        console.log(`[HAND] Using ${imageUrls.length} reference images`);
        for (const url of imageUrls) {
          content.push({
            type: "image_url",
            image_url: { url }
          });
        }
      }
      
      // Retry logic for transient errors
      const maxRetries = 2; // Reduced retries for parallel generation
      let lastError: Error | null = null;
      let response: Response | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[HAND] Attempt ${attempt}/${maxRetries} for image ${imageIndex + 1}`);
          
          // Build the request payload
          const requestPayload = {
            model: "google/gemini-3-pro-image-preview",
            messages: [
              {
                role: "user",
                content
              }
            ],
            modalities: ["image", "text"],
            size: `${width}x${height}`,
            image_size: resolution,
            generationConfig: {
              imageConfig: {
                aspectRatio: ratio,
                imageSize: resolution,
                width: width,
                height: height
              },
              thinkingConfig: {
                thinkingBudget: 16384
              }
            }
          };
          
          if (imageIndex === 0) {
            console.log(`[HAND] Request payload imageConfig:`, JSON.stringify({
              size: requestPayload.size,
              image_size: requestPayload.image_size,
              imageConfig: requestPayload.generationConfig.imageConfig
            }));
          }
          
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
          });
          
          // If we get a 5xx error and have retries left, wait and retry
          if (response.status >= 500 && attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 500;
            console.log(`[HAND] Got ${response.status}, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          break;
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 500;
            console.log(`[HAND] Fetch error, retrying in ${waitTime}ms...`, lastError.message);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!response) {
        console.error(`[HAND] Failed to generate image ${imageIndex + 1} after retries`);
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HAND] AI gateway error for image ${imageIndex + 1}:`, response.status, errorText);
        return null;
      }

      // Parse the response
      const data = await response.json();
      console.log(`[HAND] AI response received for image ${imageIndex + 1}`);
      
      // Check for error in response body
      if (data.error) {
        console.error(`[HAND] AI returned error for image ${imageIndex + 1}:`, data.error);
        return null;
      }
      
      // Extract the generated image
      const message = data.choices?.[0]?.message;
      let generatedImage: string | null = null;
      
      // Check for images array (Nano Banana format)
      if (message?.images && message.images.length > 0) {
        generatedImage = message.images[0].image_url?.url || message.images[0].url;
      }
      
      // Check for inline image in content
      if (!generatedImage && message?.content) {
        const base64Match = message.content.match(/data:image\/[^;]+;base64,[^\s"]+/);
        if (base64Match) {
          generatedImage = base64Match[0];
        }
      }
      
      if (!generatedImage) {
        console.error(`[HAND] No image found for generation ${imageIndex + 1}`);
        console.error(`[HAND] Response message keys:`, message ? Object.keys(message) : 'no message');
        console.error(`[HAND] Response content preview:`, message?.content?.substring(0, 500) || 'no content');
        return null;
      }
      
      // Get dimensions
      const dims = getImageDimensions(generatedImage);
      if (dims) {
        console.log(`[HAND] Generated image ${imageIndex + 1} dimensions: ${dims.width}x${dims.height}`);
      }
      
      // Upscale only for single image 2K/4K
      if (shouldUpscale && dims) {
        const needsUpscale = (dims.width < width * 0.9) || (dims.height < height * 0.9);
        
        if (needsUpscale) {
          console.log(`[UPSCALE] Image needs upscaling: got ${dims.width}x${dims.height}, need ${width}x${height}`);
          try {
            const upscaledImage = await upscaleImage(
              LOVABLE_API_KEY,
              generatedImage,
              width,
              height,
              dims.width,
              dims.height
            );
            
            const upscaledDims = getImageDimensions(upscaledImage);
            if (upscaledDims) {
              console.log(`[UPSCALE] Upscaled result: ${upscaledDims.width}x${upscaledDims.height}`);
            }
            
            console.log(`[HAND] Added upscaled image from generation ${imageIndex + 1}`);
            return upscaledImage;
          } catch (upscaleError) {
            console.error('[UPSCALE] Failed, using original:', upscaleError);
            return generatedImage;
          }
        }
      }
      
      console.log(`[HAND] Added image from generation ${imageIndex + 1}`);
      return generatedImage;
    };
    
    // Generate all images in parallel for speed
    console.log(`[HAND] Starting parallel generation of ${numImages} images...`);
    const imagePromises = Array.from({ length: numImages }, (_, i) => generateSingleImage(i));
    const results = await Promise.all(imagePromises);
    
    // Filter out failed generations
    const allGeneratedImages = results.filter((img): img is string => img !== null);
    console.log(`[HAND] Successfully generated ${allGeneratedImages.length}/${numImages} images`);
    
    if (allGeneratedImages.length === 0) {
      throw new Error('No images generated - try a simpler prompt or fewer reference images');
    }

    // Get final dimensions for response
    let actualDimensions = { width: 0, height: 0 };
    if (allGeneratedImages.length > 0) {
      const finalDims = getImageDimensions(allGeneratedImages[0]);
      if (finalDims) {
        actualDimensions = finalDims;
        console.log(`[FINAL] Output dimensions: ${finalDims.width}x${finalDims.height}`);
      }
    }

    console.log('=== GENERATION COMPLETE ===');
    console.log('Brain reasoning:', reasoning);
    console.log('Total images generated:', allGeneratedImages.length);
    console.log('Requested resolution:', resolution, `(${width}x${height})`);
    console.log('Actual dimensions:', actualDimensions.width > 0 ? `${actualDimensions.width}x${actualDimensions.height}` : 'unknown');

    return new Response(
      JSON.stringify({ 
        images: allGeneratedImages,
        reasoning,
        requestedResolution: { width, height, label: resolution },
        actualDimensions: actualDimensions.width > 0 ? actualDimensions : null
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
