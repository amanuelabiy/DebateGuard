'use client';

import React, { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Mic, MicOff, Download } from "lucide-react";
import { toast } from 'react-hot-toast';

interface TranscriptPanelProps {
  meetingId: string;
}

interface SavedTranscript {
  id: string;
  text: string;
  timestamp: string;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ meetingId }) => {
  console.log('TranscriptPanel rendering, meetingId:', meetingId);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [savedTranscripts, setSavedTranscripts] = useState<SavedTranscript[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());

  const {
    transcript: liveTranscript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({
    onStart: () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      setError(null);
      startTimer();
    },
    onEnd: () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      stopTimer();
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setError(error.message);
      setIsRecording(false);
      stopTimer();
    },
    onResult: (text) => {
      lastSpeechTimeRef.current = Date.now();
      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      // Set new silence timer
      silenceTimerRef.current = setTimeout(() => {
        const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
        if (timeSinceLastSpeech >= 2000) { // 2 seconds of silence
          console.log('Silence detected, saving transcript');
          saveTranscript();
        }
      }, 2000);
    }
  });

  useEffect(() => {
    console.log('TranscriptPanel mounted');
    if (browserSupportsSpeechRecognition) {
      console.log('Browser supports speech recognition');
    } else {
      console.log('Browser does not support speech recognition');
      setError("Your browser doesn't support speech recognition");
    }

    return () => {
      console.log('TranscriptPanel unmounting, stopping recording');
      stopListening();
      stopTimer();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining === 0) {
      stopRecording();
      saveTranscript();
    }
  }, [timeRemaining]);

  const startTimer = () => {
    setTimeRemaining(300);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      // Set up audio level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.min(100, (average / 128) * 100);
        console.log('Audio level:', level);
        setAudioLevel(level);
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      
      console.log('Starting speech recognition...');
      startListening();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError("Could not access microphone. Please ensure you've granted microphone permissions.");
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    stopListening();
    setIsRecording(false);
    stopTimer();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  const saveTranscript = () => {
    if (transcript.trim()) {
      console.log('Saving transcript:', transcript);
      const newTranscript: SavedTranscript = {
        id: Date.now().toString(),
        text: transcript,
        timestamp: new Date().toLocaleTimeString()
      };
      setSavedTranscripts(prev => [...prev, newTranscript]);
      setTranscript("");
      resetTranscript();
      toast.success('Transcript saved automatically');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Live Transcript</h2>
          <div className="flex items-center gap-2">
            {isRecording ? (
              <>
                <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopRecording}
                  className="size-10"
                >
                  <MicOff className="size-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={startRecording}
                className="size-10"
              >
                <Mic className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}

        {isRecording && (
          <div className="mb-4">
            <Progress value={audioLevel} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              Audio Level: {Math.round(audioLevel)}%
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-muted/20 rounded p-4 min-h-[100px]">
          {transcript ? (
            <p className="whitespace-pre-wrap">{transcript}</p>
          ) : (
            <p className="text-muted-foreground">
              {isRecording
                ? "Listening..."
                : "Click the microphone button to start recording"}
            </p>
          )}
        </div>
      </Card>

      {savedTranscripts.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Transcript History</h3>
          <div className="space-y-4">
            {savedTranscripts.map((savedTranscript) => (
              <Card key={savedTranscript.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-muted-foreground">
                    {savedTranscript.timestamp}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([savedTranscript.text], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `transcript-${meetingId}-${savedTranscript.id}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="size-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="whitespace-pre-wrap">{savedTranscript.text}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TranscriptPanel; 