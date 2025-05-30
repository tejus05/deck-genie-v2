import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generateStreamingText, createGeminiStreamingResponse } from "@/lib/gemini";

interface OutlineRequest {
  prompt: string;
  numberOfCards: number;
  language: string;
}

const outlineTemplate = `Given the following presentation topic and requirements, generate a structured outline with {numberOfCards} main topics in markdown format.
The outline should be in {language}.

Topic: {prompt}

Generate exactly {numberOfCards} main topics that would make for an engaging and well-structured presentation. 
Format the response as markdown content, with each topic as a heading followed by 2-3 bullet points.

Example format:
# First Main Topic
- Key point about this topic
- Another important aspect
- Brief conclusion or impact

# Second Main Topic
- Main insight for this section
- Supporting detail or example
- Practical application or takeaway

# Third Main Topic 
- Primary concept to understand
- Evidence or data point
- Conclusion or future direction

Make sure the topics:
1. Flow logically from one to another
2. Cover the key aspects of the main topic
3. Are clear and concise
4. Are engaging for the audience
5. ALWAYS use bullet points (not paragraphs) and format each point as "- point text"
6. Do not use bold, italic or underline
7. Keep each bullet point brief - just one sentence per point
8. Include exactly 2-3 bullet points per topic (not more, not less)`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, numberOfCards, language } =
      (await req.json()) as OutlineRequest;

    if (!prompt || !numberOfCards || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Format the prompt for Gemini
    const formattedPrompt = outlineTemplate
      .replace("{numberOfCards}", numberOfCards.toString())
      .replace("{language}", language)
      .replace("{prompt}", prompt);

    // Generate streaming response using Gemini
    const streamGenerator = generateStreamingText(formattedPrompt, "TEXT_GENERATION", {
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    return createGeminiStreamingResponse(streamGenerator);
  } catch (error) {
    console.error("Error in outline generation:", error);
    return NextResponse.json(
      { error: "Failed to generate outline" },
      { status: 500 },
    );
  }
}
