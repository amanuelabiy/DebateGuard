export class LiveTranscription {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private transcriptionCallback: ((text: string) => void) | null = null;
  private isProcessing: boolean = false;
  private chunkSize: number = 5000; // 5 seconds of audio per chunk

  constructor(stream: MediaStream, onTranscription: (text: string) => void) {
    this.stream = stream;
    this.transcriptionCallback = onTranscription;
  }

  start() {
    if (!this.stream || !this.transcriptionCallback) return;
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm',
    });
    
    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && !this.isProcessing) {
        this.isProcessing = true;
        await this.processAudioChunk(event.data);
        this.isProcessing = false;
      }
    };
    
    // Start recording and set up chunk intervals
    this.mediaRecorder.start(this.chunkSize);
  }

  stop() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private async processAudioChunk(audioBlob: Blob) {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Send to API
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: arrayBuffer,
      });
      
      const data = await response.json();
      
      // Call the callback with the transcription
      if (data.text && this.transcriptionCallback) {
        this.transcriptionCallback(data.text);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }
} 