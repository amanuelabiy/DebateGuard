// pages/api/analyze.js

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcriptSegment, context } = await request.json();

    if (!transcriptSegment) {
      return NextResponse.json(
        { error: "No transcript segment provided" },
        { status: 400 }
      );
    }

    // Create a prompt that asks for a structured JSON response
    const prompt = `Analyze this debate transcript segment for logical fallacies: "${transcriptSegment}"
If there are no fallacies, return "No logical fallacies detected."
Return a JSON response in this exact format:
{
  "fallacies": [
    {
      "type": "Name of the fallacy",
      "description": "Brief description of the fallacy",
      "fix": "Suggestion for how to fix this fallacy"
    }
  ]
}
If no fallacies are found, respond with "No logical fallacies detected."

Be concise and focus only on clear logical fallacies.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a debate analysis assistant that identifies logical fallacies and provides fixes. Respond only with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const analysis = response.choices[0]?.message?.content || "No analysis available";
    
    // Try to parse the JSON response
    try {
      const parsedAnalysis = JSON.parse(analysis);
      return NextResponse.json({ analysis: parsedAnalysis });
    } catch (error) {
      // If parsing fails, return the raw analysis
      return NextResponse.json({ analysis: { fallacies: [] } });
    }
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return NextResponse.json(
      { error: "Failed to analyze transcript" },
      { status: 500 }
    );
  }
}

