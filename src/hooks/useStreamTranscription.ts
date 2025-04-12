import { useState, useEffect, useRef } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

interface TranscriptSegment {
  speakerId: string;
  text: string;
  timestamp: string;
}

// Define SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

export const useStreamTranscription = (isRecording: boolean = false) => {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState('');
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!call || !isRecording) return;

    // Initialize speech recognition
    const initializeSpeechRecognition = () => {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionAPI();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update current segment with interim results
          setCurrentSegment(interimTranscript || finalTranscript);

          // If we have final results, add to transcript history
          if (finalTranscript.trim()) {
            const newSegment: TranscriptSegment = {
              speakerId: 'current',
              text: finalTranscript.trim(),
              timestamp: new Date().toISOString()
            };
            
            setTranscript(prev => [...prev, newSegment]);
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
        };

        // Start recognition
        recognitionRef.current.start();
      }
    };

    // Start transcription
    initializeSpeechRecognition();

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [call, isRecording]);

  // Function to assign speaker ID to a segment
  const assignSpeakerToSegment = (segment: TranscriptSegment, speakerId: string) => {
    return {
      ...segment,
      speakerId
    };
  };

  // Function to get all transcripts
  const getAllTranscripts = () => {
    return transcript;
  };

  // Function to clear transcript
  const clearTranscript = () => {
    setTranscript([]);
    setCurrentSegment('');
  };

  return {
    transcript,
    currentSegment,
    getAllTranscripts,
    clearTranscript,
    assignSpeakerToSegment
  };
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
} 