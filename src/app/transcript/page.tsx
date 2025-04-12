'use client';

import { useState, useRef, useEffect } from 'react';
import { AudioRecorder } from '@/lib/audioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Mic, Square, Upload, Video, X, Check, AlertCircle } from 'lucide-react';

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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
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
    };
  }, [isListening, stopListening]);

  // Update transcript when live transcription changes
  useEffect(() => {
    if (liveTranscript) {
      setTranscript(prev => prev + (prev ? "\n" : "") + liveTranscript);
    }
  }, [liveTranscript]);

  // Save transcript segment when it changes
  useEffect(() => {
    if (liveTranscript && conversationId) {
      saveSegment(liveTranscript);
    }
  }, [liveTranscript, conversationId]);

  const startRecording = async () => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }
    
    const success = await audioRecorderRef.current.startRecording();
    if (success) {
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;
    
    const audioBlob = await audioRecorderRef.current.stopRecording();
    setIsRecording(false);
    
    await sendAudioToAPI(audioBlob);
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

  const saveSegment = async (text: string) => {
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
    }
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
        {speechError && (
          <div className="text-red-500 mb-4">
            Speech recognition error: {speechError}
          </div>
        )}
        <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
          <p className="whitespace-pre-wrap">{liveTranscript || "No live transcription yet..."}</p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upload Transcript File</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleFileUpload}
            disabled={!file}
            className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transcript</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-wrap">{transcript}</p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="mt-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Transcript"}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Analysis</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-wrap">{analysis.analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
} 