'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, FileText, AlertCircle, Mic, MicOff, Clock } from 'lucide-react';

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

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: string;
  topics: string[];
  recommendations: string[];
}

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setTranscript(prev => prev + ' ' + transcript);
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setRecordingError(`Speech recognition error: ${event.error}`);
            stopRecording();
          };

          recognitionRef.current.onend = () => {
            if (isRecording) {
              // Restart if it ends unexpectedly while we're still recording
              recognitionRef.current?.start();
            }
          };
        }
      } else {
        setRecordingError('Speech recognition is not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Handle timer for 10-second recording window
  useEffect(() => {
    if (isRecording) {
      setTimeLeft(10);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    setTranscript('');
    setRecordingError(null);
    setIsRecording(true);
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecordingError('Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // If we have a transcript, analyze it
    if (transcript.trim()) {
      // Create a temporary file from the transcript
      const tempFile = new File(
        [transcript], 
        `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`, 
        { type: 'text/plain' }
      );
      
      // Set the file and analyze it
      setFile(tempFile);
      analyzeFile();
    }
  };

  const analyzeTranscript = async (text: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the API to analyze the transcript
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

      if (!response.ok) {
        throw new Error('Failed to analyze transcript');
      }

      const data = await response.json();
      
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
      setError('Failed to analyze the transcript. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/plain') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a .txt file');
        setFile(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type === 'text/plain') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a .txt file');
        setFile(null);
      }
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const text = await file.text();
      
      // Call the API to analyze the transcript
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptSegment: text,
          context: { source: file.name.startsWith('recording-') ? 'recording' : 'file' }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }

      const data = await response.json();
      
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analyze Debate</h1>
          <p className="text-xl text-gray-600">Record or upload your debate transcript for AI-powered analysis</p>
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

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Transcript</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-lg text-gray-600 mb-4">
                <span className="font-medium">Click to upload</span> or drag and drop
              </div>
              <p className="text-sm text-gray-500 mb-4">TXT files only</p>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Select File
              </label>
            </div>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-700">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={analyzeFile}
              disabled={!file || isAnalyzing}
              className={`px-6 py-3 rounded-lg font-medium text-white ${
                !file || isAnalyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isAnalyzing ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                'Analyze File'
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
            
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
      </div>
    </div>
  );
} 