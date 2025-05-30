import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/env.js";

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Configuration for different use cases
export const GEMINI_MODELS = {
  TEXT_GENERATION: "gemini-1.5-flash", // Fast model for general text generation
  PRO: "gemini-1.5-pro", // More capable model for complex tasks
} as const;

// Default generation configuration
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

/**
 * Create a Gemini model instance with custom configuration
 */
export function createGeminiModel(
  modelName: keyof typeof GEMINI_MODELS = "TEXT_GENERATION",
  generationConfig: Partial<typeof DEFAULT_GENERATION_CONFIG> = {}
) {
  return genAI.getGenerativeModel({
    model: GEMINI_MODELS[modelName],
    generationConfig: {
      ...DEFAULT_GENERATION_CONFIG,
      ...generationConfig,
    },
  });
}

/**
 * Generate streaming text using Gemini
 */
export async function* generateStreamingText(
  prompt: string,
  modelName: keyof typeof GEMINI_MODELS = "TEXT_GENERATION",
  generationConfig?: Partial<typeof DEFAULT_GENERATION_CONFIG>
) {
  const model = createGeminiModel(modelName, generationConfig);
  
  try {
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error("Error generating streaming text with Gemini:", error);
    throw new Error("Failed to generate text with Gemini");
  }
}

/**
 * Generate complete text using Gemini (non-streaming)
 */
export async function generateText(
  prompt: string,
  modelName: keyof typeof GEMINI_MODELS = "TEXT_GENERATION",
  generationConfig?: Partial<typeof DEFAULT_GENERATION_CONFIG>
): Promise<string> {
  const model = createGeminiModel(modelName, generationConfig);
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw new Error("Failed to generate text with Gemini");
  }
}

/**
 * Create a streaming response compatible with AI SDK
 */
export function createGeminiStreamingResponse(
  asyncGenerator: AsyncGenerator<string, void, unknown>
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        for await (const chunk of asyncGenerator) {
          // Format as AI SDK compatible chunks
          const formatted = `0:${JSON.stringify(chunk)}\n`;
          controller.enqueue(encoder.encode(formatted));
        }
      } catch (error) {
        console.error("Error in streaming response:", error);
        const errorFormatted = `2:${JSON.stringify({ error: "Stream error" })}\n`;
        controller.enqueue(encoder.encode(errorFormatted));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
