"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, AlertCircle, Timer, Users, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import DebateStreamProvider from "@/components/DebateStreamProvider";
import { useStreamTranscription } from "@/hooks/useStreamTranscription";
import axios from "axios";

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

type DebateSummary = {
  speaker1Transcript: string;
  speaker2Transcript: string;
  fallacies: {
    speaker: string;
    fallacy: string;
    fix: string;
  }[];
  analysis: string;
};

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
  const [timeUnit, setTimeUnit] = useState<"minutes" | "seconds">("minutes");
  const [timeInput, setTimeInput] = useState(5); // Default 5 minutes
  const [customTime, setCustomTime] = useState("");
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
  const [debateSummary, setDebateSummary] = useState<DebateSummary | null>(
    null
  );
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

  const handleTimeChange = (value: number, unit: "minutes" | "seconds") => {
    const seconds = unit === "minutes" ? value * 60 : value;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setTimeUnit(unit);
    setTimeInput(value);
  };

  const handleCustomTimeChange = (value: string) => {
    setCustomTime(value);
    if (value && !isNaN(Number(value))) {
      const seconds =
        timeUnit === "minutes" ? Number(value) * 60 : Number(value);
      setInitialTime(seconds);
      setTimeLeft(seconds);
    }
  };

  const applyPresetTime = (preset: number, unit: "minutes" | "seconds") => {
    const seconds = unit === "minutes" ? preset * 60 : preset;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setTimeUnit(unit);
    setTimeInput(preset);
    setCustomTime("");
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
      const summary: DebateSummary = {
        speaker1Transcript: speaker1Transcript.map((seg) => seg.text).join(" "),
        speaker2Transcript: speaker2Transcript.map((seg) => seg.text).join(" "),
        fallacies: allFallacies,
        analysis: "Analysis not provided in the API response",
      };

      setDebateSummary(summary);

      const data = JSON.stringify({
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
      });

      // Save to API
      await axios.post("/api/debate", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Debate saved successfully");
      setIsDebateActive(false);
      setShowSettings(true);
    } catch (error) {
      console.error("Error ending debate:", error);
      toast.error("Failed to save debate");
      setIsDebateActive(false);
      setShowSettings(true);
    }
  };

  const startNewDebate = () => {
    // Reset all state variables
    setCurrentSpeaker(1);
    setIsRecording(false);
    setTimeLeft(initialTime);
    setSpeaker1Transcript([]);
    setSpeaker2Transcript([]);
    setFallacies([]);
    setIsAnalyzing(false);
    setCurrentSegment("");
    setShowSettings(true);
    setIsDebateActive(false);
    setDebateSummary(null);
    setCustomTime("");

    // Clear any existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear stream transcript
    clearStreamTranscript();

    toast.success("New debate started");
  };

  return (
    <div className="flex h-screen">
      {/* Main content - Full width */}
      <div className="w-full bg-[#0D1117] p-6 overflow-y-auto">
        {debateSummary ? (
          // Debate summary view
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#E5E7EB]">
                Debate Summary
              </h2>
              <Button
                onClick={startNewDebate}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-[#E5E7EB]"
              >
                Start New Debate
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#1F2937] p-4 rounded-lg border border-[#2C3E50]">
                <h3 className="text-lg font-semibold text-[#2563EB] mb-2">
                  Speaker 1
                </h3>
                <div className="max-h-[300px] overflow-y-auto">
                  {speaker1Transcript.map((segment, index) => (
                    <div
                      key={index}
                      className="mb-2 pb-2 border-b border-[#2C3E50]"
                    >
                      <p className="text-sm text-[#9CA3AF]">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-[#E5E7EB]">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1F2937] p-4 rounded-lg border border-[#2C3E50]">
                <h3 className="text-lg font-semibold text-[#10B981] mb-2">
                  Speaker 2
                </h3>
                <div className="max-h-[300px] overflow-y-auto">
                  {speaker2Transcript.map((segment, index) => (
                    <div
                      key={index}
                      className="mb-2 pb-2 border-b border-[#2C3E50]"
                    >
                      <p className="text-sm text-[#9CA3AF]">
                        {new Date(segment.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-[#E5E7EB]">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1F2937] p-6 rounded-lg border border-[#2C3E50] mb-8">
              <h3 className="text-xl font-semibold text-[#E5E7EB] mb-4">
                Debate Analysis
              </h3>
              <div className="prose max-w-none">
                <p className="text-[#E5E7EB]">{debateSummary.analysis}</p>
              </div>
            </div>
          </div>
        ) : (
          // Active debate view
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#E5E7EB] mb-4 md:mb-0">
                Current Speaker:{" "}
                {currentSpeaker === 1 ? "Speaker 1" : "Speaker 2"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xl font-bold bg-[#1F2937] text-[#E5E7EB] px-3 py-1 rounded-md border border-[#2C3E50]">
                  {formatTime(timeLeft)}
                </div>
                <Button
                  onClick={switchSpeaker}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-[#E5E7EB]"
                  disabled={!isRecording}
                >
                  Switch Speaker
                </Button>
                <Button
                  onClick={endDebate}
                  className="bg-red-600 hover:bg-red-700 text-[#E5E7EB]"
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
                    <h3 className="text-lg font-semibold text-[#E5E7EB]">
                      Controls
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={
                        isRecording
                          ? "bg-red-600 hover:bg-red-700 text-[#E5E7EB]"
                          : "bg-[#10B981] hover:bg-[#059669] text-[#E5E7EB]"
                      }
                    >
                      {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                    <Button
                      onClick={switchSpeaker}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-[#E5E7EB]"
                      disabled={!isRecording}
                    >
                      Switch Speaker
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">
                    Live Transcription
                  </h3>
                  <div className="bg-[#1F2937] p-4 rounded-md min-h-[100px] border border-[#2C3E50]">
                    <p className="text-[#E5E7EB]">
                      {currentSegment || "Waiting for speech..."}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">
                    Timer Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => applyPresetTime(30, "seconds")}
                        className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                      >
                        30s
                      </Button>
                      <Button
                        onClick={() => applyPresetTime(1, "minutes")}
                        className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                      >
                        1m
                      </Button>
                      <Button
                        onClick={() => applyPresetTime(5, "minutes")}
                        className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                      >
                        5m
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="number"
                        min="1"
                        value={customTime}
                        onChange={(e) => handleCustomTimeChange(e.target.value)}
                        placeholder="Custom time"
                        className="w-32 p-2 border rounded bg-[#1F2937] text-[#E5E7EB] border-[#2C3E50] placeholder-[#9CA3AF]"
                      />
                      <select
                        value={timeUnit}
                        onChange={(e) => {
                          setTimeUnit(e.target.value as "minutes" | "seconds");
                          if (customTime && !isNaN(Number(customTime))) {
                            const seconds =
                              e.target.value === "minutes"
                                ? Number(customTime) * 60
                                : Number(customTime);
                            setInitialTime(seconds);
                            setTimeLeft(seconds);
                          }
                        }}
                        className="p-2 border rounded bg-[#1F2937] text-[#E5E7EB] border-[#2C3E50]"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="seconds">Seconds</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Transcript history and fallacies */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">
                    Transcript History
                  </h3>
                  <div className="bg-[#1F2937] p-4 rounded-md max-h-[300px] overflow-y-auto border border-[#2C3E50]">
                    {getAllTranscripts().map((segment, index) => (
                      <div
                        key={index}
                        className="border-b pb-2 border-[#2C3E50]"
                      >
                        <p
                          className={`font-medium ${
                            segment.speakerId === "1"
                              ? "text-[#2563EB]"
                              : "text-[#10B981]"
                          }`}
                        >
                          {segment.speakerId === "1"
                            ? "Speaker 1"
                            : "Speaker 2"}
                        </p>
                        <p className="text-[#E5E7EB]">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#E5E7EB] mb-2">
                    Detected Fallacies
                  </h3>
                  <div className="bg-[#1F2937] p-4 rounded-md border border-[#2C3E50]">
                    {fallacies.length > 0 ? (
                      <ul className="space-y-2">
                        {fallacies.map((item, index) => (
                          <li
                            key={index}
                            className="border-b pb-2 border-[#2C3E50]"
                          >
                            <p
                              className={`font-medium ${
                                item.speakerId === "1"
                                  ? "text-[#2563EB]"
                                  : "text-[#10B981]"
                              }`}
                            >
                              {item.speakerId === "1"
                                ? "Speaker 1"
                                : "Speaker 2"}
                            </p>
                            <p className="text-red-400 font-semibold">
                              Fallacy: {item.type}
                            </p>
                            <p className="text-[#10B981]">Fix: {item.fix}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#9CA3AF]">
                        No fallacies detected yet
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
