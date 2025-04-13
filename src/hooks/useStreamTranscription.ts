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
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(1);
  const [speaker1Transcript, setSpeaker1Transcript] = useState<TranscriptSegment[]>([]);
  const [speaker2Transcript, setSpeaker2Transcript] = useState<TranscriptSegment[]>([]);
  const [currentTurnText, setCurrentTurnText] = useState<string>('');
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [turnSegment, setTurnSegment] = useState<string>('');

  // Log current turn text every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Current turn text:', currentTurnText);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTurnText]);

  useEffect(() => {
    if (!call || !isRecording) return;

    let restartTimeout: NodeJS.Timeout | null = null;
    let isRestarting = false;

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
              setTurnSegment(transcript);
            }
          }

          // Add final transcript to the current turn's accumulated text
          if (finalTranscript.trim()) {
            setCurrentTurnText(prev => {
              const newText = prev + (prev ? ' ' : '') + finalTranscript.trim();
              // Update the display with the accumulated text
              setCurrentSegment(newText);
              return newText;
            });
          } else {
            // Show interim results appended to accumulated text
            setCurrentSegment(currentTurnText + (interimTranscript ? ' ' + interimTranscript : ''));
          }

          // Clear any pending restart timeout since we got results
          if (restartTimeout) {
            clearTimeout(restartTimeout);
            restartTimeout = null;
          }
        };

        if (recognitionRef.current) {
          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            // Only restart on specific errors, not on timeout/no-speech
            if (event.error !== 'no-speech' && isRecording && !isRestarting) {
              console.log('Restarting speech recognition after error:', event.error);
              isRestarting = true;
              setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.start();
                }
                isRestarting = false;
              }, 1000);
            }
          };

          // Add onend handler to restart recognition when it stops
          recognitionRef.current.onend = () => {
            console.log('Speech recognition ended');
            // Only restart if we're still supposed to be recording and not already restarting
            if (isRecording && !isRestarting) {
              // Set a timeout to restart after 5 seconds of silence
              restartTimeout = setTimeout(() => {
                console.log('Restarting speech recognition after silence');
                isRestarting = true;
                if (recognitionRef.current) {
                  recognitionRef.current.start();
                }
                isRestarting = false;
              }, 5000);
            }
          };

          // Start recognition
          recognitionRef.current.start();
        }
      }
    };

    // Start transcription
    initializeSpeechRecognition();

    // Cleanup
    return () => {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [call, isRecording]);

  const getTurnSegment = () => {
    return turnSegment;
  };

  // Function to switch speakers and append current turn to transcript
  const switchSpeaker = (newSpeaker: number) => {
    if (currentTurnText.trim()) {
      const newSegment: TranscriptSegment = {
        speakerId: currentSpeaker.toString(),
        text: currentTurnText.trim(),
        timestamp: new Date().toISOString()
      };

      // Add to speaker's transcript history
      if (currentSpeaker === 1) {
        setSpeaker1Transcript(prev => [...prev, newSegment]);
      } else {
        setSpeaker2Transcript(prev => [...prev, newSegment]);
      }
      
      // Add to main transcript
      setTranscript(prev => [...prev, newSegment]);
    }
    
    // Clear all text states
    setCurrentTurnText('');
    setCurrentSegment('');
    setTurnSegment('');
    setCurrentSpeaker(newSpeaker);
  };

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
    setCurrentTurnText('');
  };

  return {
    transcript,
    currentSegment,
    getAllTranscripts,
    clearTranscript,
    assignSpeakerToSegment,
    getTurnSegment,
    switchSpeaker
  };
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
} 