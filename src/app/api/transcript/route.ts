import { NextResponse } from 'next/server';

// Function to transcribe audio using OpenAI Whisper API
async function transcribeAudio(audioData: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to base64
    const base64Audio = Buffer.from(audioData).toString('base64');
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Audio,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Function to transcribe audio chunk for streaming
async function transcribeAudioChunk(audioData: ArrayBuffer): Promise<string> {
  try {
    return await transcribeAudio(audioData);
  } catch (error) {
    console.error('Error transcribing audio chunk:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Check if this is a streaming request
    const contentType = request.headers.get('content-type') || '';
    const isStreaming = contentType.includes('application/octet-stream');
    
    if (isStreaming) {
      // Handle streaming audio data
      const audioData = await request.arrayBuffer();
      const transcription = await transcribeAudioChunk(audioData);
      
      return NextResponse.json({
        text: transcription,
        isStreaming: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Handle regular file upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;

      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Transcribe the audio
      const transcription = await transcribeAudio(arrayBuffer);
      
      return NextResponse.json({
        text: transcription,
        timestamps: [], // We could add timestamps if needed
        confidence: 1.0 // We could add confidence if needed
      });
    }
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 