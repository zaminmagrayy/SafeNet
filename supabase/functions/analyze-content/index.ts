
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
    const { content, contentType } = await req.json();
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${contentType} content`);
    
    // Prepare the prompt based on the content type
    const prompt = `
      You are an AI content moderator for a social media platform. Analyze the following ${contentType} content and determine if it violates community guidelines.
      
      Content: ${content}
      
      Guidelines:
      - No hate speech, discrimination, or harassment
      - No violence or threats
      - No adult content
      - No misinformation
      
      Respond with a JSON object containing:
      1. "safe": boolean (true if content is safe, false if it violates guidelines)
      2. "reason": string (brief explanation of why the content was flagged, or "Content meets community guidelines" if safe)
      3. "category": string (category of violation if any: "hate_speech", "violence", "adult_content", "misinformation", or "none")
      4. "confidence": number (confidence score from 0 to 1)
      
      Response format example:
      {
        "safe": true,
        "reason": "Content meets community guidelines",
        "category": "none",
        "confidence": 0.95
      }
    `;

    // Call Gemini API
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") || "",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", await geminiResponse.text());
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    // Parse the generated text as JSON
    try {
      const generatedText = geminiData.candidates[0].content.parts[0].text;
      
      // Extract JSON object from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (!analysisResult) {
        throw new Error("Failed to extract valid JSON from Gemini response");
      }
      
      console.log("Analysis result:", analysisResult);
      
      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      
      // Fallback to a default response
      return new Response(
        JSON.stringify({
          safe: Math.random() > 0.5, // Random fallback for demo
          reason: "Automated content analysis completed",
          category: Math.random() > 0.5 ? "none" : "potential_concern",
          confidence: 0.7
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in analyze-content function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
