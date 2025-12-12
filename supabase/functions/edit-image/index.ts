import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, editPrompt, resolution = "1K", aspectRatio = "1:1" } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log(`[EDIT] Editing image with prompt: "${editPrompt}"`);
    console.log(`[EDIT] Target resolution: ${resolution}, aspectRatio: ${aspectRatio}`);

    // Process the source image
    let imageData: { mimeType: string; data: string };
    
    if (imageUrl.startsWith('data:')) {
      // Base64 image
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        imageData = { mimeType: matches[1], data: matches[2] };
      } else {
        throw new Error('Invalid base64 image format');
      }
    } else {
      // URL - fetch and convert to base64
      console.log('[EDIT] Fetching source image from URL...');
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        throw new Error(`Failed to fetch source image: ${imgResponse.status}`);
      }
      const arrayBuffer = await imgResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = imgResponse.headers.get('content-type') || 'image/png';
      imageData = { mimeType: contentType, data: base64 };
      console.log('[EDIT] Source image fetched successfully');
    }

    // Build the prompt for editing
    const fullPrompt = `Edit this food photography image: ${editPrompt}. Keep the food items visible and maintain professional food photography quality.`;

    console.log(`[EDIT] Using Gemini 3 Pro with imageSize: ${resolution}, aspectRatio: ${aspectRatio}`);

    // Build request with the same structure as generate-image (imageConfig inside generationConfig)
    const requestBody = {
      contents: [{
        parts: [
          { text: fullPrompt },
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          imageSize: resolution,    // "1K", "2K", or "4K"
          aspectRatio: aspectRatio  // "16:9", "9:16", "1:1", etc.
        }
      }
    };

    console.log('[EDIT] Request config:', JSON.stringify({
      imageSize: resolution,
      aspectRatio: aspectRatio,
      model: 'gemini-3-pro-image-preview'
    }));

    // Use native Gemini 3 Pro API for true 4K support
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[EDIT] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[EDIT] Gemini response received');

    // Extract the generated image from native API response
    let editedImageUrl: string | null = null;
    
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          editedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log('[EDIT] Successfully extracted edited image');
          break;
        }
      }
    }
    
    if (!editedImageUrl) {
      console.error('[EDIT] No image in response:', JSON.stringify(data, null, 2));
      throw new Error('No edited image was generated');
    }

    console.log(`[EDIT] Edit complete - resolution: ${resolution}, aspectRatio: ${aspectRatio}`);

    return new Response(JSON.stringify({ image: editedImageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[EDIT] Error in edit-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
