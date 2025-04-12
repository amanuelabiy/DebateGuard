export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number | null = null;
  private duration: number = 0;
  private timeLimit: number = 30; // Default 30 seconds
  private onDurationUpdate?: (duration: number) => void;

  constructor(options?: {
    timeLimit?: number;
    onDurationUpdate?: (duration: number) => void;
  }) {
    this.timeLimit = options?.timeLimit || 30;
    this.onDurationUpdate = options?.onDurationUpdate;
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      this.startTime = Date.now();
      this.duration = 0;

      // Start duration tracking
      const durationInterval = setInterval(() => {
        if (this.startTime) {
          this.duration = Math.floor((Date.now() - this.startTime) / 1000);
          if (this.onDurationUpdate) {
            this.onDurationUpdate(this.duration);
          }
        }
      }, 1000);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  stopRecording(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ blob: new Blob(), duration: 0 });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const finalDuration = this.duration;
        this.cleanup();
        resolve({ blob: audioBlob, duration: finalDuration });
      };

      this.mediaRecorder.stop();
    });
  }

  getDuration(): number {
    return this.duration;
  }

  getTimeLimit(): number {
    return this.timeLimit;
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.stream = null;
    this.audioChunks = [];
    this.startTime = null;
    this.duration = 0;
  }
} 