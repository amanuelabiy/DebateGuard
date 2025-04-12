'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Mic, Square, AlertCircle, Timer, Users, Settings } from 'lucide-react';

interface TranscriptSegment {
  text: string;
  speakerId: string;
  timestamp: string;
}

interface Fallacy {
  type: string;
  description: string;
  fix: string;
  timestamp: string;
  speakerId: string;
}

export default function DebatePage() {
  const [currentSpeaker, setCurrentSpeaker] = useState<'speaker1' | 'speaker2'>('speaker1');
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300); // Initial time in seconds
  const [speaker1Transcript, setSpeaker1Transcript] = useState<TranscriptSegment[]>([]);
  const [speaker2Transcript, setSpeaker2Transcript] = useState<TranscriptSegment[]>([]);
  const [fallacies, setFallacies] = useState<Fallacy[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSegment, setCurrentSegment] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Use the speech recognition hook
  const {
    transcript: liveTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition({
    onResult: (result) => {
      console.log('Speech recognition result:', result);
      // Only update the current segment with the new result
      setCurrentSegment(result);
    },
    continuous: true,
    language: 'en-US'
  });

  // Timer effect
  useEffect(() => {
    console.log('Timer effect triggered. isRecording:', isRecording, 'timeLeft:', timeLeft);
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      console.log('Time ran out, stopping recording and switching speaker');
      // Save the current segment before switching
      if (currentSegment.trim()) {
        const newSegment: TranscriptSegment = {
          text: currentSegment,
          speakerId: currentSpeaker,
          timestamp: new Date().toISOString()
        };
        
        if (currentSpeaker === 'speaker1') {
          setSpeaker1Transcript(prev => [...prev, newSegment]);
        } else {
          setSpeaker2Transcript(prev => [...prev, newSegment]);
        }
        analyzeSegment(currentSegment);
      }
      stopRecording();
      switchSpeaker();
    }

    return () => {
      if (timerRef.current) {
        console.log('Clearing timer interval');
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up resources');
      if (isListening) {
        console.log('Stopping listening on unmount');
        stopListening();
      }
      if (timerRef.current) {
        console.log('Clearing timer on unmount');
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  const startRecording = async () => {
    console.log('Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      setIsRecording(true);
      console.log('Starting speech recognition');
      resetTranscript(); // Reset before starting
      startListening();
      setTimeLeft(initialTime); // Use the initial time
      setShowSettings(false); // Hide settings when debate starts
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (currentSegment.trim()) {
      console.log('Saving final segment:', currentSegment);
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker,
        timestamp: new Date().toISOString()
      };
      
      // Add to the appropriate speaker's transcript
      if (currentSpeaker === 'speaker1') {
        console.log('Adding to speaker1 transcript');
        setSpeaker1Transcript(prev => [...prev, newSegment]);
      } else {
        console.log('Adding to speaker2 transcript');
        setSpeaker2Transcript(prev => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }
    setIsRecording(false);
    console.log('Stopping speech recognition');
    stopListening();
    resetTranscript(); // Reset after stopping
    setCurrentSegment('');
    console.log('Recording stopped');
  };

  const switchSpeaker = () => {
    console.log('Switching speaker from:', currentSpeaker);
    
    // Save the current segment before switching
    if (currentSegment.trim()) {
      console.log('Saving segment before switch:', currentSegment);
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker,
        timestamp: new Date().toISOString()
      };
      
      // Add to the appropriate speaker's transcript
      if (currentSpeaker === 'speaker1') {
        console.log('Adding to speaker1 transcript');
        setSpeaker1Transcript(prev => [...prev, newSegment]);
      } else {
        console.log('Adding to speaker2 transcript');
        setSpeaker2Transcript(prev => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }
    
    // Reset speech recognition for the new speaker
    resetTranscript();
    setCurrentSegment('');
    
    // Toggle between speaker1 and speaker2 immediately
    const newSpeaker = currentSpeaker === 'speaker1' ? 'speaker2' : 'speaker1';
    console.log('Switching to:', newSpeaker);
    setCurrentSpeaker(newSpeaker);
    setTimeLeft(initialTime); // Reset timer to initial time
  };

  const analyzeSegment = async (text: string) => {
    if (!text.trim()) return;
    
    console.log('Analyzing segment:', text);
    setIsAnalyzing(true);
    try {
      console.log('Sending analysis request to API');
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptSegment: text,
          context: { source: 'debate', speaker: currentSpeaker }
        }),
      });

      if (!response.ok) {
        console.error('Analysis API error:', response.status, response.statusText);
        throw new Error("Failed to analyze transcript");
      }

      const data = await response.json();
      console.log('Analysis response:', data);
      
      if (data.analysis && data.analysis.fallacies && data.analysis.fallacies.length > 0) {
        // Convert the API response to our Fallacy format
        const newFallacies: Fallacy[] = data.analysis.fallacies.map((fallacy: any) => ({
          type: fallacy.type,
          description: fallacy.description,
          fix: fallacy.fix,
          timestamp: new Date().toISOString(),
          speakerId: currentSpeaker
        }));
        
        console.log('Setting new fallacies:', newFallacies);
        setFallacies(newFallacies);
      } else {
        // No fallacies detected
        setFallacies([]);
      }
    } catch (error) {
      console.error("Error analyzing transcript:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (minutes: number) => {
    console.log('Changing time to:', minutes, 'minutes');
    setInitialTime(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  // Get the current speaker's transcript
  const getCurrentTranscript = () => {
    return currentSpeaker === 'speaker1' ? speaker1Transcript : speaker2Transcript;
  };

  // Get all transcripts in chronological order
  const getAllTranscripts = () => {
    const allTranscripts = [...speaker1Transcript, ...speaker2Transcript];
    return allTranscripts.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  // Log state changes
  useEffect(() => {
    console.log('Current speaker changed to:', currentSpeaker);
  }, [currentSpeaker]);

  useEffect(() => {
    console.log('Recording state changed to:', isRecording);
  }, [isRecording]);

  useEffect(() => {
    console.log('Speech recognition listening state:', isListening);
  }, [isListening]);

  useEffect(() => {
    console.log('Current segment updated:', currentSegment);
  }, [currentSegment]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Debate Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Time per speaker (minutes)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={Math.floor(initialTime / 60)}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="w-12 text-center">{Math.floor(initialTime / 60)}</span>
              </div>
            </div>
            <button
              onClick={startRecording}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md"
            >
              Start Debate
            </button>
          </div>
        </div>
      )}

      {/* Speaker Status */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-lg">
              Current Speaker: {currentSpeaker === 'speaker1' ? 'Speaker 1' : 'Speaker 2'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span className="text-xl font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Live Caption */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg min-h-[100px]">
        <h3 className="text-lg font-semibold mb-2">Live Caption</h3>
        <p className="text-xl">{currentSegment || 'Waiting for speech...'}</p>
      </div>

      {/* Controls */}
      {!showSettings && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-md ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {isRecording ? (
              <>
                <Square className="h-5 w-5 inline-block mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 inline-block mr-2" />
                Start Recording
              </>
            )}
          </button>
          <button
            onClick={switchSpeaker}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md"
          >
            Switch Speaker
          </button>
        </div>
      )}

      {/* Fallacy Alerts */}
      {fallacies.length > 0 && (
        <div className="mb-4 p-4 bg-red-900/50 rounded-lg border border-red-500">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Logical Fallacies Detected
          </h3>
          <div className="space-y-2">
            {fallacies.map((fallacy, index) => (
              <div
                key={index}
                className="p-2 rounded bg-red-500/20"
              >
                <p className="font-medium">
                  {fallacy.speakerId === 'speaker1' ? 'Speaker 1' : 'Speaker 2'} presented a {fallacy.type}
                </p>
                <p className="text-sm opacity-80">{fallacy.description}</p>
                <p className="text-sm mt-1 text-green-300">
                  <span className="font-medium">Fix:</span> {fallacy.fix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript History */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Transcript History</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {getAllTranscripts().map((segment, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                segment.speakerId === 'speaker1'
                  ? 'bg-blue-500/20'
                  : 'bg-green-500/20'
              }`}
            >
              <span className="font-medium">
                {segment.speakerId === 'speaker1' ? 'Speaker 1' : 'Speaker 2'}:
              </span>{' '}
              {segment.text}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {speechError && (
        <div className="mt-4 p-4 bg-red-500/20 text-red-200 rounded-lg">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {speechError}
          </p>
        </div>
      )}
      
      {/* Debug Info */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg text-xs font-mono">
        <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>Current Speaker: {currentSpeaker}</div>
          <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
          <div>Listening: {isListening ? 'Yes' : 'No'}</div>
          <div>Time Left: {formatTime(timeLeft)}</div>
          <div>Speaker 1 Segments: {speaker1Transcript.length}</div>
          <div>Speaker 2 Segments: {speaker2Transcript.length}</div>
          <div>Current Segment: {currentSegment || '(empty)'}</div>
          <div>Analyzing: {isAnalyzing ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
} 