'use client';

import { useState, useRef, useEffect } from 'react';
import { AudioRecorder } from '@/lib/audioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Mic, Square, Upload, Video, X, Check, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '@/types';

export default function TranscriptPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [segments, setSegments] = useState<{ text: string; timestamp: Date }[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  
  // Use the speech recognition hook
  const {
    transcript: liveTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript: resetLiveTranscript,
    error: speechError
  } = useSpeechRecognition({
    onResult: (text) => {
      // You can add additional processing here if needed
      console.log('Live transcription update:', text);
      
      // Update transcript with new text
      if (text && text.trim()) {
        setTranscript(prev => {
          // Only append if it's new content
          if (prev && !prev.endsWith(text)) {
            return prev + "\n" + text;
          }
          return text;
        });
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setError(`Speech recognition error: ${error}`);
    },
    continuous: true,
    language: 'en-US'
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening, stopListening]);

  // Handle timer for 30-second recording window
  useEffect(() => {
    if (isRecording) {
      // Start the timer
      setTimeLeft(30);
      recordingStartTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up, stop recording
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear the timer when recording stops
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Update transcript when live transcription changes
  useEffect(() => {
    if (liveTranscript) {
      setTranscript(prev => {
        // Only append if it's new content
        if (prev && !prev.endsWith(liveTranscript)) {
          return prev + "\n" + liveTranscript;
        }
        return liveTranscript;
      });
    }
  }, [liveTranscript]);

  const startRecording = async () => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
      // Start speech recognition when recording starts
      startListening();
      // Reset transcript
      setTranscript("");
      resetLiveTranscript();
      setError(null);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;
    
    // Stop speech recognition first
    stopListening();
    
    const audioBlob = await audioRecorderRef.current.stopRecording();
    setIsRecording(false);
    
    // Create a segment with the final transcript
    if (transcript && transcript.trim()) {
      const newSegment = {
        text: transcript,
        timestamp: new Date()
      };
      
      setSegments(prev => [...prev, newSegment]);
      
      // Save the segment to the database
      if (conversationId) {
        saveSegment(transcript);
      }
      
      // Analyze the transcript for fallacies
      analyzeTranscript(transcript);
    }
    
    await sendAudioToAPI(audioBlob);
  };

  const analyzeTranscript = async (text: string) => {
    if (!text || !text.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptSegment: text,
          context: { source: 'recording' }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze transcript");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error analyzing transcript:", error);
      setError("Failed to analyze transcript. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save segments to the database
  const saveSegment = async (text: string) => {
    if (!conversationId || !text.trim()) return;
    
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          segment: {
            text,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save segment");
      }
    } catch (error) {
      console.error("Error saving segment:", error);
      setError("Failed to save transcript segment");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTranscript("");
      setAnalysis(null);
      setError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError(null);
      const response = await fetch("/api/transcript", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe file");
      }

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (error) {
      setError("Error transcribing file. Please try again.");
      console.error("Error:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze transcript");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      setError("Error analyzing transcript. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartNewConversation = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      setConversationId(data.id);
      setTranscript("");
      setAnalysis(null);
      setError(null);
    } catch (error) {
      setError("Error creating new conversation. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const sendAudioToAPI = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    
    try {
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.text) {
                setTranscript(data.text);
                resolve(data);
              } else {
                reject(new Error('No transcription text received'));
              }
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Server responded with ${xhr.status}: ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });
        
        xhr.open('POST', '/api/transcript');
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error sending audio:', error);
      throw error;
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setUploadSuccess(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Debate Transcript Analysis</h1>

      {/* Live Transcription Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Live Transcription</h2>
        <div className="flex gap-4 mb-4">
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
                <Square className="h-5 w-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Recording
              </>
            )}
          </button>
          <button
            onClick={handleStartNewConversation}
            disabled={isSaving}
            className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? "Creating..." : "New Conversation"}
          </button>
        </div>
        
        {/* Timer Display */}
        {isRecording && (
          <div className="mb-4 flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm font-medium">{timeLeft}s</span>
          </div>
        )}
        
        {/* Speech Recognition Error */}
        {speechError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {speechError}
          </div>
        )}
        
        {/* Live Transcript Display */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium mb-2">Live Transcript</h3>
          <p className="whitespace-pre-wrap min-h-[100px]">
            {transcript || (isRecording ? "Listening..." : "No transcript yet")}
          </p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upload Audio File</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Choose File
          </button>
          {file && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{file.name}</span>
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setFile(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
          </div>
        )}
        
        {/* Upload Error */}
        {uploadError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {uploadError}
          </div>
        )}
        
        {/* Upload Success */}
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
            <Check className="h-5 w-5 mr-2" />
            File uploaded successfully!
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && !isRecording && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transcript</h2>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="whitespace-pre-wrap">{transcript}</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="whitespace-pre-wrap">{analysis}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 