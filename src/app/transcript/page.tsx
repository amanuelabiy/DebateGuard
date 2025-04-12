'use client';

import { useState, useRef, useEffect } from 'react';
import { AudioRecorder } from '@/lib/audioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Mic, Square, Upload, Video, X, Check, AlertCircle } from 'lucide-react';

export default function TranscriptPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    setIsUploading(true);
    
    // Validate file type
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/webm', 'audio/mpeg', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      setUploadError(`Unsupported file type: ${file.type}. Please upload MP3, WAV, or WebM files.`);
      setIsUploading(false);
      return;
    }
    
    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 25MB.');
      setIsUploading(false);
      return;
    }
    
    try {
      await sendAudioToAPI(file);
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Audio Transcription</h1>
      
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
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
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white transition-colors`}
          >
            {isListening ? (
              <>
                <Square className="h-5 w-5" />
                Stop Live Transcription
              </>
            ) : (
              <>
                <Video className="h-5 w-5" />
                Start Live Transcription
              </>
            )}
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-lg font-semibold mb-2">Or Upload an Audio File</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="audio/*"
                className="hidden"
                id="audio-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="audio-upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                } text-white transition-colors`}
              >
                <Upload className="h-5 w-5" />
                {isUploading ? 'Uploading...' : 'Upload Audio File'}
              </label>
              <span className="text-sm text-gray-500">
                Supported formats: MP3, WAV, WebM (max 25MB)
              </span>
            </div>
            
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            {uploadError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span>{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-green-500 bg-green-50 p-3 rounded-md">
                <Check className="h-5 w-5" />
                <span>File uploaded and transcribed successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {transcript && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">File Transcript</h2>
            <button 
              onClick={clearTranscript}
              className="text-gray-500 hover:text-gray-700"
              title="Clear transcript"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
      
      {liveTranscript && (
        <div className="bg-blue-100 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Live Transcript</h2>
            <button 
              onClick={resetLiveTranscript}
              className="text-gray-500 hover:text-gray-700"
              title="Clear transcript"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="whitespace-pre-wrap text-gray-800">{liveTranscript}</p>
        </div>
      )}
      
      {speechError && (
        <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span>{speechError}</span>
        </div>
      )}
    </div>
  );
} 