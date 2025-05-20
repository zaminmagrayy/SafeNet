
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
const GEMINI_VISION_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent";

interface RequestBody {
  content: string;
  contentType: "video" | "image" | "text";
}

serve(async (req) => {
  try {
    // Get the request body
    const requestBody = await req.json() as RequestBody;
    const { content, contentType } = requestBody;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
            JSON.stringify({ error: "Failed to process image URL", details: error.message }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // Just use the text description for now since we can't easily process uploaded files
        // In a real implementation, you'd handle file uploads properly
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
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in analyze-content function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
