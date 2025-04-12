import { NextResponse } from 'next/server';

// Function to transcribe audio using OpenAI Whisper API with speaker diarization
async function transcribeAudio(audioData: ArrayBuffer, speakerId?: string): Promise<{ text: string; speakerId?: string }> {
  try {
    // Create a Blob from the ArrayBuffer
    const audioBlob = new Blob([audioData], { type: 'audio/webm' });
    
    // Create FormData and append the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');
    
    // Add speaker identification if provided
    if (speakerId) {
      formData.append('speaker_id', speakerId);
    }
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return {
      text: data.text,
      speakerId: speakerId
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Function to transcribe audio chunk for streaming
async function transcribeAudioChunk(audioData: ArrayBuffer, speakerId?: string): Promise<{ text: string; speakerId?: string }> {
  try {
    return await transcribeAudio(audioData, speakerId);
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
    
    // Get speaker ID from headers if present
    const speakerId = request.headers.get('x-speaker-id') || undefined;
    
    if (isStreaming) {
      // Handle streaming audio data
      const audioData = await request.arrayBuffer();
      const transcription = await transcribeAudioChunk(audioData, speakerId);
      
      return NextResponse.json({
        text: transcription.text,
        speakerId: transcription.speakerId,
        isStreaming: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Handle regular file upload
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      const fileSpeakerId = formData.get('speakerId') as string;

      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Transcribe the audio with speaker ID
      const transcription = await transcribeAudio(arrayBuffer, fileSpeakerId || speakerId);
      
      return NextResponse.json({
        text: transcription.text,
        speakerId: transcription.speakerId,
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