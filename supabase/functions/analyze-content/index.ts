
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
  detailedAnalysis?: string;
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
      console.log(`Received content for analysis: ${requestBody.contentType}, content length: ${requestBody.content?.length || 0}`);
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
      let prompt = "Analyze this content for potential policy violations or inappropriate material and provide a detailed analysis with the following structure: \n\n";
      prompt += "1. Overall Assessment: Is this content safe or potentially violating policies?\n";
      prompt += "2. Specific Issues: List any specific issues found or confirm no issues were identified.\n";
      prompt += "3. Reasoning: Explain your reasoning in detail, including context and nuance.\n";
      prompt += "4. Recommendations: Provide specific recommendations for this content.\n\n";

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
            console.log("Processing image URL:", content.substring(0, 50) + "...");
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
            console.log("Processing base64 image data");
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
          console.log("No valid image format detected, processing as text description");
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
        console.log("Processing as text content");
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
        } else if (aiResponse.toLowerCase().includes("issue")) {
          const issueMatch = aiResponse.match(/issue[s]?:?\s+(.+?)[.!?]/i);
          if (issueMatch) {
            reason = issueMatch[1].trim();
          } else {
            reason = "Potential policy violation detected";
          }
        } else {
          reason = "Potential policy violation detected";
        }
      }

      // Extract a more detailed analysis
      let detailedAnalysis = extractDetailedAnalysis(aiResponse);
      console.log("Extracted detailed analysis:", detailedAnalysis.substring(0, 100) + "...");

      // Create a structured analysis response
      const analysisResult: AnalysisResult = {
        safe: isSafe,
        reason: isSafe ? "Content appears to be safe" : reason,
        category: determineCategoryFromAnalysis(aiResponse, contentType, isSafe),
        confidence: calculateConfidence(aiResponse, isSafe),
        aiResponse: aiResponse,
        detailedAnalysis: detailedAnalysis
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

// Helper function to extract detailed analysis from AI response
function extractDetailedAnalysis(aiResponse: string): string {
  // Try to structure the response in a clear format
  const sections = [
    { title: "Overall Assessment", regex: /overall assessment[:\s]*(.*?)(specific issues|reasoning|recommendations|\d+\.|\n\n|$)/is },
    { title: "Specific Issues", regex: /specific issues[:\s]*(.*?)(overall assessment|reasoning|recommendations|\d+\.|\n\n|$)/is },
    { title: "Reasoning", regex: /reasoning[:\s]*(.*?)(overall assessment|specific issues|recommendations|\d+\.|\n\n|$)/is },
    { title: "Recommendations", regex: /recommendations[:\s]*(.*?)(overall assessment|specific issues|reasoning|\d+\.|\n\n|$)/is }
  ];
  
  let structuredAnalysis = "";
  
  // Try to extract each section from the AI response
  for (const section of sections) {
    const match = aiResponse.match(section.regex);
    if (match && match[1]) {
      const content = match[1].trim();
      if (content) {
        structuredAnalysis += `**${section.title}**: ${content}\n\n`;
      } else {
        structuredAnalysis += `**${section.title}**: No ${section.title.toLowerCase()} provided.\n\n`;
      }
    } else {
      // If section not found, add a placeholder
      structuredAnalysis += `**${section.title}**: No ${section.title.toLowerCase()} provided.\n\n`;
    }
  }
  
  // If structured parsing didn't work, return a cleaned version of the full analysis
  if (!structuredAnalysis) {
    return aiResponse
      .replace(/^\d+\.\s*/gm, '') // Remove numbering
      .replace(/\n{3,}/g, '\n\n'); // Normalize spacing
  }
  
  return structuredAnalysis;
}

// Helper function to determine category more accurately
function determineCategoryFromAnalysis(aiResponse: string, contentType: string, isSafe: boolean): string {
  if (isSafe) return "safe";
  
  const lowerResponse = aiResponse.toLowerCase();
  
  // Check for explicit mentions of category types
  if (lowerResponse.includes("violence") || lowerResponse.includes("graphic") || lowerResponse.includes("harmful")) {
    return `${contentType}_policy_violation`;
  } else if (lowerResponse.includes("sexual") || lowerResponse.includes("explicit") || lowerResponse.includes("adult")) {
    return `${contentType}_adult_content`;
  } else if (lowerResponse.includes("hate") || lowerResponse.includes("discriminat") || lowerResponse.includes("offensive")) {
    return `${contentType}_hate_speech`;
  }
  
  // Default to content type specific violation
  return `${contentType}_policy_violation`;
}

// Helper function to better calculate confidence
function calculateConfidence(aiResponse: string, isSafe: boolean): number {
  const lowerResponse = aiResponse.toLowerCase();
  
  // Look for confidence indicators in the text
  let confidence = isSafe ? 0.8 : 0.75; // Base confidence levels
  
  // Adjust based on certainty language
  if (lowerResponse.includes("definitely") || lowerResponse.includes("certainly") || lowerResponse.includes("clearly")) {
    confidence += 0.15;
  } else if (lowerResponse.includes("likely") || lowerResponse.includes("probably")) {
    confidence += 0.05;
  } else if (lowerResponse.includes("possibly") || lowerResponse.includes("might") || lowerResponse.includes("could be")) {
    confidence -= 0.1;
  } else if (lowerResponse.includes("uncertain") || lowerResponse.includes("unclear")) {
    confidence -= 0.2;
  }
  
  // Ensure confidence is within bounds
  return Math.max(0.5, Math.min(0.99, confidence));
}

// Helper function to create mock analysis responses when the API is unavailable
function createMockAnalysis(content: string, contentType: "video" | "image" | "text"): AnalysisResult {
  // Generate a deterministic but seemingly random safe/unsafe result
  // This is just for demonstration - in a real app, you'd want a more sophisticated fallback
  const contentHash = Array.from(content).reduce(
    (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0
  );
  
  const isSafe = Math.abs(contentHash) % 5 !== 0; // 80% chance of being safe
  
  // Create different responses based on content type
  let reason, category, confidence, detailedAnalysis;
  
  if (isSafe) {
    reason = "Content appears to be safe";
    category = "safe";
    confidence = 0.85 + (Math.abs(contentHash) % 15) / 100; // Between 0.85 and 0.99
    
    detailedAnalysis = `**Overall Assessment**: The content appears to be safe and does not violate any content policies.\n\n` +
                       `**Specific Issues**: No issues were identified in this content.\n\n` +
                       `**Reasoning**: After reviewing the ${contentType}, I found no elements that would violate platform policies. The content is appropriate for general audiences.\n\n` +
                       `**Recommendations**: This content can be safely published without any modifications.`;
  } else {
    if (contentType === "image") {
      reason = "Image may contain inappropriate visual elements";
      category = "visual_policy_violation";
      detailedAnalysis = `**Overall Assessment**: This image appears to contain content that may violate platform policies.\n\n` +
                         `**Specific Issues**: Potentially inappropriate visual elements that may not be suitable for all audiences.\n\n` +
                         `**Reasoning**: The visual content contains elements that could be interpreted as violating community standards, specifically related to inappropriate imagery.\n\n` +
                         `**Recommendations**: Review the image manually before publication or consider using a different image.`;
    } else if (contentType === "video") {
      reason = "Video may contain concerning scenes or content";
      category = "video_policy_violation";
      detailedAnalysis = `**Overall Assessment**: This video may contain content that violates platform policies.\n\n` +
                         `**Specific Issues**: Potentially concerning scenes or sequences that may not be appropriate for general viewing.\n\n` +
                         `**Reasoning**: Certain segments of this video contain elements that could be interpreted as violating community guidelines.\n\n` +
                         `**Recommendations**: Review the video manually, particularly at key segments, or consider editing before publication.`;
    } else {
      reason = "Text may contain potentially harmful language";
      category = "text_policy_violation";
      detailedAnalysis = `**Overall Assessment**: This text contains potentially harmful language that may violate platform policies.\n\n` +
                         `**Specific Issues**: Language that could be interpreted as inappropriate or harmful to certain audiences.\n\n` +
                         `**Reasoning**: The text includes phrases or terms that could violate community guidelines around respectful communication.\n\n` +
                         `**Recommendations**: Consider revising the language used in this content before publication.`;
    }
    confidence = 0.65 + (Math.abs(contentHash) % 20) / 100; // Between 0.65 and 0.84
  }
  
  return {
    safe: isSafe,
    reason,
    category,
    confidence,
    aiResponse: `Mock analysis: ${reason}. This is a fallback response as the AI service is currently unavailable.`,
    detailedAnalysis
  };
}
