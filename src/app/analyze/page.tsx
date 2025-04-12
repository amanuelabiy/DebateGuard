'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Mic, MicOff, Clock, Save, History } from 'lucide-react';

// Define SpeechRecognition types
interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  topics: string[];
  recommendations: string[];
}

interface ConversationSegment {
  id: string;
  text: string;
  timestamp: Date;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Conversation tracking
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationSegments, setConversationSegments] = useState<ConversationSegment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzingFullConversation, setIsAnalyzingFullConversation] = useState(false);
  const [fullConversationAnalysis, setFullConversationAnalysis] = useState<string | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    console.log("Initializing speech recognition");
    if (typeof window !== 'undefined') {
      // Use type assertion to avoid TypeScript errors
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        console.log("Speech recognition API available");
        recognitionRef.current = new SpeechRecognitionAPI();
        if (recognitionRef.current) {
          // Configure recognition
          recognitionRef.current.continuous = false; // Change to false to get one result at a time
          recognitionRef.current.interimResults = false; // Change to false to only get final results
          recognitionRef.current.lang = 'en-US';
          console.log("Speech recognition configured");

          // Set up event handlers
          recognitionRef.current.onstart = () => {
            console.log("Speech recognition started");
          };

          recognitionRef.current.onresult = (event: any) => {
            console.log("Speech recognition result event received");
            console.log("Event results:", event.results);
            
            // Get the transcript from the first result
            if (event.results && event.results.length > 0 && event.results[0].length > 0) {
              const currentTranscript = event.results[0][0].transcript;
              console.log("Current transcript:", currentTranscript);
              
              // Update the transcript state
              setTranscript(currentTranscript);
            } else {
              console.log("No valid results in the event");
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setRecordingError(`Speech recognition error: ${event.error}`);
            stopRecording();
          };

          recognitionRef.current.onend = () => {
            console.log("Speech recognition ended");
            // Only restart if we're still supposed to be recording
            if (isRecording) {
              try {
                console.log("Restarting speech recognition");
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition', e);
              }
            }
          };
        }
      } else {
        console.error("Speech recognition API not available");
        setRecordingError('Speech recognition is not supported in this browser');
      }
    }

    // Initialize conversation ID if not already set
    if (!conversationId) {
      const newConversationId = generateConversationId();
      setConversationId(newConversationId);
      console.log("Created new conversation ID:", newConversationId);
    }

    return () => {
      console.log("Cleaning up speech recognition");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Generate a unique conversation ID
  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Handle timer for 10-second recording window
  useEffect(() => {
    console.log("Timer effect triggered, isRecording:", isRecording);
    if (isRecording) {
      setTimeLeft(10);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          console.log("Timer tick, time left:", prev);
          if (prev <= 1) {
            console.log("Timer reached zero, stopping recording");
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        console.log("Clearing timer");
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        console.log("Cleaning up timer");
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    console.log("Starting recording");
    setTranscript('');
    setRecordingError(null);
    setIsRecording(true);
    
    try {
      if (recognitionRef.current) {
        console.log("Starting speech recognition");
        recognitionRef.current.start();
      } else {
        console.error("Speech recognition not initialized");
        setRecordingError('Speech recognition not initialized');
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording. Current transcript:", transcript);
    setIsRecording(false);
    if (recognitionRef.current) {
      console.log("Stopping speech recognition");
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      console.log("Clearing timer");
      clearInterval(timerRef.current);
    }
    
    // Only analyze if we have a transcript
    if (transcript && transcript.trim()) {
      console.log("Recording finished. Transcript:", transcript);
      
      // Add the transcript to the conversation segments
      const newSegment: ConversationSegment = {
        id: `segment_${Date.now()}`,
        text: transcript,
        timestamp: new Date()
      };
      
      setConversationSegments(prev => [...prev, newSegment]);
      
      // Only analyze if the timer reached zero (full 10 seconds)
      if (timeLeft === 0) {
        // Add a 4-second delay before analyzing
        console.log("Full 10-second recording completed. Waiting 4 seconds before analyzing...");
        setTimeout(() => {
          console.log("Calling analyzeTranscript() after delay");
          analyzeTranscript(transcript);
        }, 4000);
      } else {
        console.log("Recording stopped early. No analysis will be performed. Time left:", timeLeft);
      }
    } else {
      console.log("No transcript to analyze");
    }
  };

  const analyzeTranscript = async (text: string) => {
    console.log("analyzeTranscript called with text:", text);
    if (!text || !text.trim()) {
      console.log("No text to analyze");
      return;
    }

    console.log("Starting transcript analysis");
    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the API to analyze the transcript
      console.log("Sending API request to /api/analyze");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptSegment: text,
          context: { source: 'recording' }
        }),
      });

      console.log("API response status:", response.status);
      if (!response.ok) {
        throw new Error('Failed to analyze transcript');
      }

      const data = await response.json();
      console.log("API response data:", data);
      
      if (data.success && data.analysis) {
        // Create a simple analysis result with the raw text
        setAnalysisResult({
          summary: data.analysis,
          keyPoints: [],
          sentiment: "N/A",
          topics: [],
          recommendations: []
        });
      } else {
        throw new Error('Invalid response from analysis API');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze the text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveConversation = async () => {
    if (!conversationId || conversationSegments.length === 0) {
      setError('No conversation to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log("Saving conversation to database");
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          segments: conversationSegments
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }

      const data = await response.json();
      console.log("Save response:", data);
      
      // Show success message
      alert('Conversation saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save the conversation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeFullConversation = async () => {
    if (conversationSegments.length === 0) {
      setError('No conversation to analyze');
      return;
    }

    setIsAnalyzingFullConversation(true);
    setError(null);
    setFullConversationAnalysis(null);

    try {
      // Combine all segments into one text
      const fullText = conversationSegments
        .map(segment => segment.text)
        .join('\n\n');
      
      console.log("Analyzing full conversation");
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptSegment: fullText,
          context: { 
            source: 'full_conversation',
            segmentCount: conversationSegments.length
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze full conversation');
      }

      const data = await response.json();
      console.log("Full analysis response:", data);
      
      if (data.success && data.analysis) {
        setFullConversationAnalysis(data.analysis);
      } else {
        throw new Error('Invalid response from analysis API');
      }
    } catch (err) {
      console.error('Full analysis error:', err);
      setError('Failed to analyze the full conversation. Please try again.');
    } finally {
      setIsAnalyzingFullConversation(false);
    }
  };

  const startNewConversation = () => {
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    setConversationSegments([]);
    setTranscript('');
    setAnalysisResult(null);
    setFullConversationAnalysis(null);
    console.log("Started new conversation with ID:", newConversationId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analyze Debate</h1>
          <p className="text-xl text-gray-600">Record your debate transcript for AI-powered analysis</p>
        </div>

        {/* Conversation Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Conversation</h2>
              <p className="text-sm text-gray-500">
                ID: {conversationId || 'Not started'} | Segments: {conversationSegments.length}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={saveConversation}
                disabled={isSaving || conversationSegments.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white ${
                  isSaving || conversationSegments.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } transition-colors flex items-center`}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </button>
              <button
                onClick={analyzeFullConversation}
                disabled={isAnalyzingFullConversation || conversationSegments.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white ${
                  isAnalyzingFullConversation || conversationSegments.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors flex items-center`}
              >
                {isAnalyzingFullConversation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <History className="h-4 w-4 mr-2" />
                )}
                Analyze Full
              </button>
              <button
                onClick={startNewConversation}
                className="px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                New Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Recording Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Transcript</h2>
          
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-gray-300">
            {isRecording ? (
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Mic className="h-8 w-8 text-red-500 animate-pulse mr-2" />
                  <span className="text-xl font-medium text-gray-700">Recording...</span>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-lg font-medium text-gray-700">{timeLeft} seconds remaining</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Recording
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Mic className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600 mb-4">
                  Record a 10-second debate transcript
                </p>
                <button
                  onClick={startRecording}
                  disabled={isAnalyzing}
                  className={`px-6 py-3 rounded-lg font-medium text-white ${
                    isAnalyzing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors flex items-center`}
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </button>
              </div>
            )}
          </div>

          {recordingError && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {recordingError}
            </div>
          )}

          {transcript && !isRecording && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recorded Transcript</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Analyzing your transcript...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Segment Analysis</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{analysisResult.summary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Conversation Analysis */}
        {isAnalyzingFullConversation && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Analyzing full conversation...</p>
            </div>
          </div>
        )}

        {fullConversationAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Conversation Analysis</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{fullConversationAnalysis}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation History */}
        {conversationSegments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversation History</h2>
            
            <div className="space-y-4">
              {conversationSegments.map((segment, index) => (
                <div key={segment.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Segment {index + 1}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(segment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{segment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 