
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
const GEMINI_VISION_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent";

interface RequestBody {
  content: string;
  contentType: "video" | "image" | "text";
}

serve(async (req) => {
  // Set CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
  };
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get the request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json() as RequestBody;
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid request body", details: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { content, contentType } = requestBody;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Analyzing content:", contentType);

    // Define the prompt based on content type
    let prompt = "Analyze this content for potential policy violations or inappropriate material. ";

    if (contentType === "image") {
      prompt += "This is an image. Focus on visual elements that might be concerning.";
    } else if (contentType === "video") {
      prompt += "This is a video. Consider potential inappropriate scenes or content.";
    } else {
      prompt += "This is text. Look for harmful language, threats, or inappropriate content.";
    }

    // Create the request payload
    let geminiPayload;
    let apiUrl = GEMINI_API_URL;

    if (contentType === "image") {
      // For image analysis, we need to use gemini-pro-vision and handle base64 image
      apiUrl = GEMINI_VISION_API_URL;
      
      // Handle potential URL or base64 string
      if (content.startsWith("http")) {
        // If it's a URL, try to fetch the image
        try {
          const imageResponse = await fetch(content);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }
          
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
          
          geminiPayload = {
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg", // Assuming JPEG, adjust if needed
                    data: base64Image
                  }
                }
              ]
            }]
          };
        } catch (error) {
          console.error("Error fetching image:", error);
          return new Response(
            JSON.stringify({ 
              error: "Failed to process image URL", 
              details: error.message,
              safe: false,
              reason: "Failed to process the image"
            }),
            { status: 400, headers: corsHeaders }
          );
        }
      } else if (content.startsWith("data:image")) {
        // If it's a base64 data URL
        try {
          // Extract the base64 part after the comma
          const base64Image = content.split(',')[1];
          if (!base64Image) {
            throw new Error("Invalid base64 image format");
          }
          
          geminiPayload = {
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: content.split(';')[0].split(':')[1], // Extract mime type
                    data: base64Image
                  }
                }
              ]
            }]
          };
        } catch (error) {
          console.error("Error processing base64 image:", error);
          return new Response(
            JSON.stringify({ 
              error: "Failed to process base64 image", 
              details: error.message,
              safe: false,
              reason: "Failed to process the image"
            }),
            { status: 400, headers: corsHeaders }
          );
        }
      } else {
        // Just use the text description as fallback
        geminiPayload = {
          contents: [{
            parts: [
              { text: `${prompt} Content description: ${content}` }
            ]
          }]
        };
      }
    } else {
      // For text and other content types
      geminiPayload = {
        contents: [{
          parts: [
            { text: `${prompt} Content: ${content}` }
          ]
        }]
      };
    }

    // Call the Gemini API
    try {
      const geminiResponse = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Gemini API error:", geminiResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: `Gemini API error: ${geminiResponse.status}`, 
            details: errorText,
            safe: false,
            reason: "AI analysis service unavailable"
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      const geminiData = await geminiResponse.json();
      
      // Process the response
      const aiResponse = geminiData.candidates[0].content.parts[0].text;
      
      // Parse the AI response to determine if content is safe
      const isSafe = !aiResponse.toLowerCase().includes("unsafe") &&
                    !aiResponse.toLowerCase().includes("violate") &&
                    !aiResponse.toLowerCase().includes("inappropriate");
      
      // Extract reason if content is not safe
      let reason = "No specific issues found";
      if (!isSafe) {
        // Try to extract a reason from the AI response
        const reasonMatch = aiResponse.match(/because (.+?)[.!?]/i);
        if (reasonMatch) {
          reason = reasonMatch[1].trim();
        } else {
          reason = "Potential policy violation detected";
        }
      }

      // Create a structured analysis response
      const analysisResult = {
        safe: isSafe,
        reason: isSafe ? "Content appears to be safe" : reason,
        category: isSafe ? "safe" : "policy_violation",
        confidence: isSafe ? 0.9 : 0.8,
        aiResponse: aiResponse,
      };

      return new Response(
        JSON.stringify(analysisResult),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to analyze content with AI", 
          details: error.message,
          safe: false,
          reason: "AI analysis failed"
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
  } catch (error) {
    console.error("Error in analyze-content function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        safe: false,
        reason: "Server error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
