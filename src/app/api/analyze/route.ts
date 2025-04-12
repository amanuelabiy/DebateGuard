// pages/api/analyze.js

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcriptSegment, context } = body;

    if (!transcriptSegment) {
      return NextResponse.json(
        { success: false, error: 'Missing transcriptSegment in request body.' },
        { status: 400 }
      );
    }

    // Craft the prompt using the received transcript segment
    // context can contain additional info like speaker names, debate session ID, etc.
    const prompt = `Below is a segment of a debate transcript:
    
"${transcriptSegment}"
  
Please analyze the segment for any logical fallacies (such as ad hominem, straw man, false dichotomy, etc.) or bad-faith debate tactics. 
Provide a mediator-style response that includes:
- A list of detected fallacies (if any).
- Suggestions on how both parties can reframe their argument constructively.
- General tone analysis and recommendations for de-escalation if needed.`;

    // Call the OpenAI API (for example, GPT-4) with the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: "You are a debate mediator who offers constructive feedback." },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error?.message || 'AI analysis failed.' },
        { status: response.status }
      );
    }

    // Extract the response text from the AI
    const analysis = data.choices[0].message.content;
    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Error during AI analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
