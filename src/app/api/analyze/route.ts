// pages/api/analyze.js

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcriptSegment, context } = body;

    if (!transcriptSegment) {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    // Analyze the transcript using ChatGPT
    const analysis = await analyzeTranscript(transcriptSegment, context);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error in analyze API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function analyzeTranscript(transcript: string, context: any) {
  const prompt = `
You are a debate analysis assistant. Analyze the following transcript for logical fallacies.

For each fallacy you find:
1. Name the fallacy
2. Quote the exact sentence that triggered it
3. Explain how to fix it

Format your response as:
FALLACY: [Name of fallacy]
TRIGGER: [Exact quote]
FIX: [How to fix it]

If no fallacies are found, respond with "No logical fallacies detected."

Transcript:
${transcript}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a debate analysis assistant that identifies logical fallacies in arguments.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}
