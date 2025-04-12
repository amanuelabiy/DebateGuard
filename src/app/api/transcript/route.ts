import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // TODO: Implement Whisper API integration
    // For now, return a mock response
    const mockResponse = {
      text: "This is a mock transcription",
      timestamps: [
        { start: 0, end: 2, text: "This is" },
        { start: 2, end: 4, text: "a mock" },
        { start: 4, end: 6, text: "transcription" }
      ],
      confidence: 0.95
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 