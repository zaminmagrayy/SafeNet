
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const GEMINI_VISION_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

interface RequestBody {
  content: string;
  contentType: "video" | "image" | "text";
}

interface AnalysisResult {
  safe: boolean;
  reason: string;
  category: string;
  confidence: number;
  aiResponse?: string;
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
    // Parse request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json() as RequestBody;
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          details: error.message,
          safe: false,
          reason: "Invalid request format" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { content, contentType } = requestBody;

    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: "Content is required",
          safe: false,
          reason: "Missing content"
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Analyzing content: ${contentType}, API key available: ${GEMINI_API_KEY ? "Yes" : "No"}, Using model: gemini-1.5-flash`);

    // Check if API key is available
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      console.log("Gemini API key not found, using mock response");
      // Return a mock analysis since no API key is available
      const mockResult: AnalysisResult = createMockAnalysis(content, contentType);
      
      return new Response(
        JSON.stringify(mockResult),
        { headers: corsHeaders }
      );
    }

    // Continue with normal API call if API key is present
    try {
      // Create the appropriate prompt based on content type
      let prompt = "Analyze this content for potential policy violations or inappropriate material. ";

      if (contentType === "image") {
        prompt += "This is an image. Focus on visual elements that might be concerning.";
      } else if (contentType === "video") {
        prompt += "This is a video. Consider potential inappropriate scenes or content.";
      } else {
        prompt += "This is text. Look for harmful language, threats, or inappropriate content.";
      }

      // Set up API URL based on content type
      let apiUrl = GEMINI_API_URL;
      let geminiPayload;

      // Handle different content types
      if (contentType === "image") {
        apiUrl = GEMINI_VISION_API_URL;
        
        // Process image content (URL or base64)
        if (content.startsWith("http")) {
          // Process image URL
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
                      mime_type: "image/jpeg",
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1
              }
            };
          } catch (error) {
            console.error("Failed to process image URL:", error);
            const mockResult = createMockAnalysis(content, contentType);
            return new Response(JSON.stringify(mockResult), { headers: corsHeaders });
          }
        } else if (content.startsWith("data:image")) {
          // Process base64 data URL
          try {
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
                      mime_type: content.split(';')[0].split(':')[1],
                      data: base64Image
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1
              }
            };
          } catch (error) {
            console.error("Failed to process base64 image:", error);
            const mockResult = createMockAnalysis(content, contentType);
            return new Response(JSON.stringify(mockResult), { headers: corsHeaders });
          }
        } else {
          // Fallback for text description
          geminiPayload = {
            contents: [{
              parts: [
                { text: `${prompt} Content description: ${content}` }
              ]
            }],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1
            }
          };
        }
      } else {
        // For text and other content types
        geminiPayload = {
          contents: [{
            parts: [
              { text: `${prompt} Content: ${content}` }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1
          }
        };
      }

      console.log("Calling Gemini API with model gemini-1.5-flash...", apiUrl);
      
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
        console.error(`Gemini API error: ${geminiResponse.status}`, errorText);
        // Fallback to mock analysis on API error
        const mockResult = createMockAnalysis(content, contentType);
        return new Response(JSON.stringify(mockResult), { headers: corsHeaders });
      }

      const geminiData = await geminiResponse.json();
      
      if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected Gemini API response format:", JSON.stringify(geminiData));
        const mockResult = createMockAnalysis(content, contentType);
        return new Response(JSON.stringify(mockResult), { headers: corsHeaders });
      }
      
      // Process the response
      const aiResponse = geminiData.candidates[0].content.parts[0].text;
      console.log("Gemini API response received:", aiResponse.substring(0, 100) + "...");
      
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
      const analysisResult: AnalysisResult = {
        safe: isSafe,
        reason: isSafe ? "Content appears to be safe" : reason,
        category: isSafe ? "safe" : "policy_violation",
        confidence: isSafe ? 0.9 : 0.8,
        aiResponse: aiResponse,
      };

      console.log("Analysis complete, returning result");
      return new Response(
        JSON.stringify(analysisResult),
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const mockResult = createMockAnalysis(content, contentType);
      return new Response(JSON.stringify(mockResult), { headers: corsHeaders });
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

// Helper function to create mock analysis responses when the API is unavailable
function createMockAnalysis(content: string, contentType: "video" | "image" | "text"): AnalysisResult {
  // Generate a deterministic but seemingly random safe/unsafe result
  // This is just for demonstration - in a real app, you'd want a more sophisticated fallback
  const contentHash = Array.from(content).reduce(
    (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0
  );
  
  const isSafe = Math.abs(contentHash) % 5 !== 0; // 80% chance of being safe
  
  // Create different responses based on content type
  let reason, category, confidence;
  
  if (isSafe) {
    reason = "Content appears to be safe";
    category = "safe";
    confidence = 0.85 + (Math.abs(contentHash) % 15) / 100; // Between 0.85 and 0.99
  } else {
    if (contentType === "image") {
      reason = "Image may contain inappropriate visual elements";
      category = "visual_policy_violation";
    } else if (contentType === "video") {
      reason = "Video may contain concerning scenes or content";
      category = "video_policy_violation";
    } else {
      reason = "Text may contain potentially harmful language";
      category = "text_policy_violation";
    }
    confidence = 0.65 + (Math.abs(contentHash) % 20) / 100; // Between 0.65 and 0.84
  }
  
  return {
    safe: isSafe,
    reason,
    category,
    confidence,
    aiResponse: `Mock analysis: ${reason}. This is a fallback response as the AI service is currently unavailable.`
  };
}
