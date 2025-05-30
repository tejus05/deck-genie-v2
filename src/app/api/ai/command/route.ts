import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateStreamingText, createGeminiStreamingResponse } from "@/lib/gemini";

interface AICommandRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  command?: string;
}

const SYSTEM_PROMPT = `You are an AI writing assistant integrated into a text editor. Your role is to help users improve their writing, provide suggestions, and assist with various text-related tasks.

Key guidelines:
1. Be concise and helpful
2. Focus on improving the user's writing
3. Provide specific, actionable suggestions
4. Maintain the user's voice and style
5. Be professional yet approachable

Available commands:
- "improve": Enhance the selected text while maintaining meaning
- "shorten": Make the text more concise
- "expand": Add more detail and context
- "tone": Adjust the tone (formal, casual, professional, etc.)
- "grammar": Fix grammar and spelling issues
- "explain": Explain a concept or provide more information
- "continue": Continue writing from where the user left off`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, command } = (await req.json()) as AICommandRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // Build the conversation context
    let conversationContext = SYSTEM_PROMPT + "\n\n";
    
    if (command) {
      conversationContext += `Current command: ${command}\n\n`;
    }

    conversationContext += "Conversation:\n";
    messages.forEach((message) => {
      conversationContext += `${message.role}: ${message.content}\n`;
    });

    // Add specific instruction based on the latest user message
    conversationContext += "\nPlease provide a helpful response based on the conversation above. Keep your response focused and practical.";

    // Generate streaming response using Gemini
    const streamGenerator = generateStreamingText(conversationContext, "TEXT_GENERATION", {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    return createGeminiStreamingResponse(streamGenerator);
  } catch (error) {
    console.error("Error in AI command:", error);
    return NextResponse.json(
      { error: "Failed to process AI command" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}