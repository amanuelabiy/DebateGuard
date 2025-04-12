"use client";

import { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Mic, Square, AlertCircle, Timer, Users, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";

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
  const [currentSpeaker, setCurrentSpeaker] = useState<"speaker1" | "speaker2">(
    "speaker1"
  );
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300); // Initial time in seconds
  const [speaker1Transcript, setSpeaker1Transcript] = useState<
    TranscriptSegment[]
  >([]);
  const [speaker2Transcript, setSpeaker2Transcript] = useState<
    TranscriptSegment[]
  >([]);
  const [fallacies, setFallacies] = useState<Fallacy[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSegment, setCurrentSegment] = useState("");
  const [showSettings, setShowSettings] = useState(true);
  const [isDebateActive, setIsDebateActive] = useState(false);
  const [debateSummary, setDebateSummary] = useState<{
    speaker1Transcript: string;
    speaker2Transcript: string;
    fallacies: Array<{ speaker: string; fallacy: string; fix: string }>;
  } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Use the speech recognition hook
  const {
    transcript: liveTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (result) => {
      console.log("Speech recognition result:", result);
      // Only update the current segment with the new result
      setCurrentSegment(result);
    },
    continuous: true,
    language: "en-US",
  });

  // Timer effect
  useEffect(() => {
    console.log(
      "Timer effect triggered. isRecording:",
      isRecording,
      "timeLeft:",
      timeLeft
    );
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      console.log("Time ran out, stopping recording and switching speaker");
      // Save the current segment before switching
      if (currentSegment.trim()) {
        const newSegment: TranscriptSegment = {
          text: currentSegment,
          speakerId: currentSpeaker,
          timestamp: new Date().toISOString(),
        };

        if (currentSpeaker === "speaker1") {
          setSpeaker1Transcript((prev) => [...prev, newSegment]);
        } else {
          setSpeaker2Transcript((prev) => [...prev, newSegment]);
        }
        analyzeSegment(currentSegment);
      }
      stopRecording();
      switchSpeaker();
    }

    return () => {
      if (timerRef.current) {
        console.log("Clearing timer interval");
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up resources");
      if (isListening) {
        console.log("Stopping listening on unmount");
        stopListening();
      }
      if (timerRef.current) {
        console.log("Clearing timer on unmount");
        clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  const startRecording = async () => {
    console.log("Starting recording...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      setIsRecording(true);
      console.log("Starting speech recognition");
      resetTranscript(); // Reset before starting
      startListening();
      setTimeLeft(initialTime); // Use the initial time
      setShowSettings(false); // Hide settings when debate starts
      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    if (currentSegment.trim()) {
      console.log("Saving final segment:", currentSegment);
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker,
        timestamp: new Date().toISOString(),
      };

      // Add to the appropriate speaker's transcript
      if (currentSpeaker === "speaker1") {
        console.log("Adding to speaker1 transcript");
        setSpeaker1Transcript((prev) => [...prev, newSegment]);
      } else {
        console.log("Adding to speaker2 transcript");
        setSpeaker2Transcript((prev) => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }
    setIsRecording(false);
    console.log("Stopping speech recognition");
    stopListening();
    resetTranscript(); // Reset after stopping
    setCurrentSegment("");
    console.log("Recording stopped");
  };

  const switchSpeaker = () => {
    console.log("Switching speaker from:", currentSpeaker);

    // Save the current segment before switching
    if (currentSegment.trim()) {
      console.log("Saving segment before switch:", currentSegment);
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker,
        timestamp: new Date().toISOString(),
      };

      // Add to the appropriate speaker's transcript
      if (currentSpeaker === "speaker1") {
        console.log("Adding to speaker1 transcript");
        setSpeaker1Transcript((prev) => [...prev, newSegment]);
      } else {
        console.log("Adding to speaker2 transcript");
        setSpeaker2Transcript((prev) => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }

    // Reset speech recognition for the new speaker
    resetTranscript();
    setCurrentSegment("");

    // Toggle between speaker1 and speaker2 immediately
    const newSpeaker = currentSpeaker === "speaker1" ? "speaker2" : "speaker1";
    console.log("Switching to:", newSpeaker);
    setCurrentSpeaker(newSpeaker);
    setTimeLeft(initialTime); // Reset timer to initial time
  };

  const analyzeSegment = async (text: string) => {
    if (!text.trim()) return;

    console.log("Analyzing segment:", text);
    setIsAnalyzing(true);
    try {
      console.log("Sending analysis request to API");
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptSegment: text,
          context: { source: "debate", speaker: currentSpeaker },
        }),
      });

      if (!response.ok) {
        console.error(
          "Analysis API error:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to analyze transcript");
      }

      const data = await response.json();
      console.log("Analysis response:", data);

      if (
        data.analysis &&
        data.analysis.fallacies &&
        data.analysis.fallacies.length > 0
      ) {
        // Convert the API response to our Fallacy format
        const newFallacies: Fallacy[] = data.analysis.fallacies.map(
          (fallacy: any) => ({
            type: fallacy.type,
            description: fallacy.description,
            fix: fallacy.fix,
            timestamp: new Date().toISOString(),
            speakerId: currentSpeaker,
          })
        );

        console.log("Setting new fallacies:", newFallacies);
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimeChange = (minutes: number) => {
    console.log("Changing time to:", minutes, "minutes");
    setInitialTime(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  // Get the current speaker's transcript
  const getCurrentTranscript = () => {
    return currentSpeaker === "speaker1"
      ? speaker1Transcript
      : speaker2Transcript;
  };

  // Get all transcripts in chronological order
  const getAllTranscripts = () => {
    const allTranscripts = [...speaker1Transcript, ...speaker2Transcript];
    return allTranscripts.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  // Log state changes
  useEffect(() => {
    console.log("Current speaker changed to:", currentSpeaker);
  }, [currentSpeaker]);

  useEffect(() => {
    console.log("Recording state changed to:", isRecording);
  }, [isRecording]);

  useEffect(() => {
    console.log("Speech recognition listening state:", isListening);
  }, [isListening]);

  useEffect(() => {
    console.log("Current segment updated:", currentSegment);
  }, [currentSegment]);

  const endDebate = async () => {
    console.log("Ending debate...");
    try {
      // Stop recording if active
      if (isRecording) {
        stopRecording();
      }

      // Save final segment if exists
      if (currentSegment.trim()) {
        const timestamp = new Date().toISOString();
        if (currentSpeaker === "speaker1") {
          setSpeaker1Transcript((prev) => [
            ...prev,
            {
              speakerId: "speaker1",
              text: currentSegment,
              timestamp,
            },
          ]);
        } else {
          setSpeaker2Transcript((prev) => [
            ...prev,
            {
              speakerId: "speaker2",
              text: currentSegment,
              timestamp,
            },
          ]);
        }
      }

      // Collect all fallacies
      const allFallacies = fallacies.map((item) => ({
        speaker: item.speakerId,
        fallacy: item.type,
        fix: item.fix,
      }));

      // Create debate summary
      const summary = {
        speaker1Transcript: speaker1Transcript.map((seg) => seg.text).join(" "),
        speaker2Transcript: speaker2Transcript.map((seg) => seg.text).join(" "),
        fallacies: allFallacies,
      };

      setDebateSummary(summary);

      // Save to API
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: {
            speaker1: speaker1Transcript,
            speaker2: speaker2Transcript,
          },
          analysis: allFallacies,
          participants: ["Speaker 1", "Speaker 2"],
          metadata: {
            duration: initialTime - timeLeft,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save debate");
      }

      toast.success("Debate saved successfully");
      setIsDebateActive(false);
      setShowSettings(true);
    } catch (error) {
      console.error("Error ending debate:", error);
      toast.error("Failed to save debate");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">DebateGuard</h1>

        {debateSummary ? (
          <div className="flex gap-4">
            {/* Zoom-like video call interface (left side) */}
            <div className="w-1/5 bg-gray-800 rounded-lg shadow-md p-4 flex flex-col">
              <div className="text-white text-center mb-4">
                <h3 className="text-lg font-semibold">Debate Complete</h3>
                <p className="text-sm text-gray-400">Summary available</p>
              </div>

              {/* Speaker 1 summary */}
              <div className="bg-gray-700 rounded-lg mb-4 aspect-video flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <p>Speaker 1</p>
                </div>
              </div>

              {/* Speaker 2 summary */}
              <div className="bg-gray-700 rounded-lg mb-4 aspect-video flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <p>Speaker 2</p>
                </div>
              </div>

              {/* Call controls */}
              <div className="mt-auto flex justify-center">
                <Button
                  onClick={() => setDebateSummary(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  Start New Debate
                </Button>
              </div>
            </div>

            {/* Debate summary (right side) */}
            <div className="w-4/5 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Debate Summary
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">
                    Speaker 1
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {debateSummary.speaker1Transcript}
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    Speaker 2
                  </h3>
                  <div className="max-h-60 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {debateSummary.speaker2Transcript}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-red-700 mb-2">
                  Detected Fallacies
                </h3>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  {debateSummary.fallacies.length > 0 ? (
                    <ul className="space-y-3">
                      {debateSummary.fallacies.map((item, index) => (
                        <li key={index} className="border-b pb-2">
                          <p className="font-medium text-blue-700">
                            Speaker:{" "}
                            {item.speaker === "speaker1"
                              ? "Speaker 1"
                              : "Speaker 2"}
                          </p>
                          <p className="text-red-700 font-semibold">
                            Fallacy: {item.fallacy}
                          </p>
                          <p className="text-green-700">Fix: {item.fix}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No fallacies detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {showSettings ? (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Debate Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time per Speaker (seconds)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="600"
                      value={initialTime}
                      onChange={(e) => setInitialTime(Number(e.target.value))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={startRecording}>Start Debate</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                {/* Zoom-like video call interface (left side) */}
                <div className="w-1/5 bg-gray-800 rounded-lg shadow-md p-4 flex flex-col">
                  <div className="text-white text-center mb-4">
                    <h3 className="text-lg font-semibold">Video Call</h3>
                    <p className="text-sm text-gray-400">
                      Speaker {currentSpeaker === "speaker1" ? "1" : "2"} is
                      active
                    </p>
                  </div>

                  {/* Main speaker video */}
                  <div className="bg-gray-700 rounded-lg mb-4 aspect-video flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {currentSpeaker === "speaker1" ? "1" : "2"}
                        </span>
                      </div>
                      <p>Speaker {currentSpeaker === "speaker1" ? "1" : "2"}</p>
                    </div>
                  </div>

                  {/* Other speaker video */}
                  <div className="bg-gray-700 rounded-lg mb-4 aspect-video flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-xl font-bold">
                          {currentSpeaker === "speaker1" ? "2" : "1"}
                        </span>
                      </div>
                      <p>Speaker {currentSpeaker === "speaker1" ? "2" : "1"}</p>
                    </div>
                  </div>

                  {/* Call controls */}
                  <div className="mt-auto flex justify-center space-x-4">
                    <button className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </button>
                    <button className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <Square className="h-5 w-5 text-white" />
                    </button>
                    <button className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Fallacy checker and controls (right side) */}
                <div className="w-4/5 bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-blue-700">
                      {currentSpeaker === "speaker1"
                        ? "Speaker 1"
                        : "Speaker 2"}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-md">
                        {Math.floor(timeLeft / 60)}:
                        {(timeLeft % 60).toString().padStart(2, "0")}
                      </div>
                      <Button
                        onClick={switchSpeaker}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Switch Speaker
                      </Button>
                      <Button
                        onClick={endDebate}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        End Debate
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-blue-700">
                        Live Caption
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={
                            isRecording
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        >
                          {isRecording ? "Stop Recording" : "Start Recording"}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-md min-h-[100px] border border-blue-200">
                      <p className="text-gray-800">
                        {currentSegment || "Waiting for speech..."}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                      Transcript History
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md max-h-[200px] overflow-y-auto border border-gray-200">
                      {getAllTranscripts().map((segment, index) => (
                        <div key={index} className="border-b pb-2">
                          <p className="font-medium text-blue-700">
                            {segment.speakerId === "speaker1"
                              ? "Speaker 1"
                              : "Speaker 2"}
                          </p>
                          <p className="text-gray-800">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                      Detected Fallacies
                    </h3>
                    <div className="bg-red-50 p-4 rounded-md border border-red-200">
                      {fallacies.length > 0 ? (
                        <ul className="space-y-2">
                          {fallacies.map((item, index) => (
                            <li key={index} className="border-b pb-2">
                              <p className="font-medium text-blue-700">
                                {item.speakerId === "speaker1"
                                  ? "Speaker 1"
                                  : "Speaker 2"}
                              </p>
                              <p className="text-red-700 font-semibold">
                                Fallacy: {item.type}
                              </p>
                              <p className="text-green-700">Fix: {item.fix}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">
                          No fallacies detected yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
