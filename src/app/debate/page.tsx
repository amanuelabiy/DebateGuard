"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, AlertCircle, Timer, Users, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import DebateStreamProvider from "@/components/DebateStreamProvider";
import { useStreamTranscription } from "@/hooks/useStreamTranscription";

interface TranscriptSegment {
  speakerId: string;
  text: string;
  timestamp: string;
}

interface AudioLevel {
  speakerId: string;
  level: number;
}

interface Fallacy {
  type: string;
  description: string;
  fix: string;
  speakerId: string;
  timestamp: string;
}

function AudioLevelMeter({ level }: { level: number }) {
  // Normalize the level to 0-100
  const normalizedLevel = Math.min(100, Math.max(0, (level / 255) * 100));

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-all duration-100"
        style={{ width: `${normalizedLevel}%` }}
      />
    </div>
  );
}

function DebateContent() {
  const [currentSpeaker, setCurrentSpeaker] = useState<1 | 2>(1);
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0]);

  // Use the Stream transcription hook
  const {
    transcript: streamTranscript,
    currentSegment: streamCurrentSegment,
    getAllTranscripts: getStreamTranscripts,
    clearTranscript: clearStreamTranscript,
    assignSpeakerToSegment,
  } = useStreamTranscription(isRecording);

  // Update current segment from Stream transcription
  useEffect(() => {
    if (streamCurrentSegment) {
      setCurrentSegment(streamCurrentSegment);
    }
  }, [streamCurrentSegment]);

  // Timer effect
  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Save the current segment before switching
      if (currentSegment.trim()) {
        const newSegment: TranscriptSegment = {
          text: currentSegment,
          speakerId: currentSpeaker.toString(),
          timestamp: new Date().toISOString(),
        };

        if (currentSpeaker === 1) {
          setSpeaker1Transcript((prev) => [...prev, newSegment]);
        } else {
          setSpeaker2Transcript((prev) => [...prev, newSegment]);
        }
        analyzeSegment(currentSegment);
      }
      setIsRecording(false);
      switchSpeaker();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  // Effect to handle Stream transcription updates
  useEffect(() => {
    if (currentSpeaker.toString() && currentSegment) {
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker.toString(),
        timestamp: new Date().toISOString(),
      };

      if (currentSpeaker === 1) {
        setSpeaker1Transcript((prev) => [...prev, newSegment]);
      } else {
        setSpeaker2Transcript((prev) => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }
  }, [currentSpeaker, currentSegment]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTimeLeft(initialTime);
      setShowSettings(false);
      setIsDebateActive(true);
      clearStreamTranscript(); // Clear any previous transcript
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Save the current segment before stopping
    if (currentSegment.trim()) {
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker.toString(),
        timestamp: new Date().toISOString(),
      };

      if (currentSpeaker === 1) {
        setSpeaker1Transcript((prev) => [...prev, newSegment]);
      } else {
        setSpeaker2Transcript((prev) => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }
  };

  const switchSpeaker = () => {
    if (currentSegment.trim()) {
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker.toString(),
        timestamp: new Date().toISOString(),
      };

      if (currentSpeaker === 1) {
        setSpeaker1Transcript((prev) => [...prev, newSegment]);
      } else {
        setSpeaker2Transcript((prev) => [...prev, newSegment]);
      }
      analyzeSegment(currentSegment);
    }

    setCurrentSegment("");
    const newSpeaker = currentSpeaker === 1 ? 2 : 1;
    setCurrentSpeaker(newSpeaker);
    setTimeLeft(initialTime);
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
          context: { source: "debate", speaker: currentSpeaker.toString() },
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
            speakerId: currentSpeaker.toString(),
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
    return currentSpeaker === 1 ? speaker1Transcript : speaker2Transcript;
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
        if (currentSpeaker === 1) {
          setSpeaker1Transcript((prev) => [
            ...prev,
            {
              speakerId: "1",
              text: currentSegment,
              timestamp,
            },
          ]);
        } else {
          setSpeaker2Transcript((prev) => [
            ...prev,
            {
              speakerId: "2",
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

  // Update audio levels
  const updateAudioLevel = (level: number) => {
    setAudioLevels((prev) => {
      const newLevels = [...prev];
      newLevels[currentSpeaker - 1] = level;
      return newLevels;
    });
  };

  // Update audio levels
  const updateAudioLevel = (level: number) => {
    setAudioLevels((prev) => {
      const newLevels = [...prev];
      newLevels[currentSpeaker - 1] = level;
      return newLevels;
    });
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Video call (20% width) */}
      <div className="w-1/5 bg-gray-900 p-4 flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* Main speaker video */}
          <div className="bg-gray-800 rounded-lg mb-4 aspect-video flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {currentSpeaker === 1 ? "S1" : "S2"}
            </div>
          </div>

          {/* Secondary speaker video */}
          <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
              {currentSpeaker === 1 ? "S2" : "S1"}
            </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex justify-center space-x-4 py-4">
          <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
            <Mic size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Right side - Fallacy checker and transcription (80% width) */}
      <div className="w-4/5 bg-white p-6 overflow-y-auto">
        {debateSummary ? (
          // Debate summary view
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">
              Debate Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  Speaker 1
                </h3>
                <div className="max-h-[300px] overflow-y-auto">
                  {speaker1Transcript.map((segment, index) => (
                    <div
                      key={index}
                      className="mb-2 pb-2 border-b border-blue-200"
                    >
                      <p className="text-sm text-gray-500">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-800">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  Speaker 2
                </h3>
                <div className="max-h-[300px] overflow-y-auto">
                  {speaker2Transcript.map((segment, index) => (
                    <div
                      key={index}
                      className="mb-2 pb-2 border-b border-green-200"
                    >
                      <p className="text-sm text-gray-500">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-800">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Detected Fallacies
              </h3>
              <div className="max-h-[300px] overflow-y-auto">
                {fallacies.length > 0 ? (
                  fallacies.map((fallacy, index) => (
                    <div
                      key={index}
                      className="mb-4 pb-4 border-b border-red-200"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-red-700">
                          Speaker {fallacy.speakerId}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(fallacy.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mt-1">
                        <strong>{fallacy.type}:</strong> {fallacy.description}
                      </p>
                      <p className="text-green-700 mt-1">
                        <strong>Fix:</strong> {fallacy.fix}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">
                    No fallacies detected in this debate.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setDebateSummary(null);
                  setSpeaker1Transcript([]);
                  setSpeaker2Transcript([]);
                  setFallacies([]);
                  setCurrentSegment("");
                  setTimeLeft(initialTime);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start New Debate
              </Button>
            </div>
          </div>
        ) : (
          // Active debate view
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-700">
                Debate Session
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                  <Timer className="h-4 w-4 text-blue-700 mr-1" />
                  <span className="text-blue-700 font-medium">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <Button
                  onClick={endDebate}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  End Debate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left column - Controls and live transcription */}
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-blue-700">
                      Controls
                    </h3>
                  </div>
                  <div className="flex space-x-2">
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
                    <Button
                      onClick={switchSpeaker}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!isRecording}
                    >
                      Switch Speaker
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">
                    Live Transcription
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-md min-h-[100px] border border-blue-200">
                    <p className="text-gray-800">
                      {currentSegment || "Waiting for speech..."}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">
                    Timer Settings
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleTimeChange(3)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                      3 min
                    </Button>
                    <Button
                      onClick={() => handleTimeChange(5)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                      5 min
                    </Button>
                    <Button
                      onClick={() => handleTimeChange(10)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                    >
                      10 min
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right column - Transcript history and fallacies */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-700 mb-2">
                    Transcript History
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md max-h-[300px] overflow-y-auto border border-gray-200">
                    {getAllTranscripts().map((segment, index) => (
                      <div key={index} className="border-b pb-2 mb-2">
                        <div className="flex justify-between">
                          <p className="font-medium text-blue-700">
                            {segment.speakerId === "1"
                              ? "Speaker 1"
                              : "Speaker 2"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(segment.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-gray-800">{segment.text}</p>
                      </div>
                    ))}
                    {getAllTranscripts().length === 0 && (
                      <p className="text-gray-500 italic">
                        No transcript yet. Start recording to see transcriptions
                        here.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-red-700 mb-2">
                    Detected Fallacies
                  </h3>
                  <div className="bg-red-50 p-4 rounded-md max-h-[200px] overflow-y-auto border border-red-200">
                    {fallacies.length > 0 ? (
                      fallacies.map((fallacy, index) => (
                        <div
                          key={index}
                          className="border-b border-red-200 pb-2 mb-2"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-red-700">
                              Speaker {fallacy.speakerId}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(fallacy.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-800">
                            <strong>{fallacy.type}:</strong>{" "}
                            {fallacy.description}
                          </p>
                          <p className="text-green-700 text-sm">
                            <strong>Fix:</strong> {fallacy.fix}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 italic">
                        No fallacies detected yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DebatePage() {
  return (
    <DebateStreamProvider>
      <DebateContent />
    </DebateStreamProvider>
  );
}
