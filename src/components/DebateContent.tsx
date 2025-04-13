"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Mic, Square, AlertCircle, Timer, Users, Settings } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import DebateStreamProvider from "@/components/DebateStreamProvider";
import { useStreamTranscription } from "@/hooks/useStreamTranscription";
import { StreamVideoParticipant, useCall } from "@stream-io/video-react-sdk";
import axios from "axios";
import { io } from "socket.io-client";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

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

interface DebateSummary {
  transcripts: Record<string, string>;
  fallacies: {
    speaker: string;
    fallacy: string;
    fix: string;
    timestamp: string;
    description: string;
  }[];
  analysis?: string;
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
  const { id } = useParams();
  const [currentSpeaker, setCurrentSpeaker] =
    useState<StreamVideoParticipant | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [initialTime, setInitialTime] = useState(300); // Initial time in seconds
  const [isDebateActive, setIsDebateActive] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speakerTranscripts, setSpeakerTranscripts] = useState<
    Record<string, TranscriptSegment[]>
  >({});
  const [fallacies, setFallacies] = useState<Fallacy[]>([]);
  const [currentSegment, setCurrentSegment] = useState("");
  const [debateSummary, setDebateSummary] = useState<DebateSummary | null>(
    null
  );
  const [participants, setParticipants] = useState<StreamVideoParticipant[]>(
    []
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const user = useUser();
  const [isConnected, setIsConnected] = useState(false);

  const call = useCall();

  const socket = useMemo(
    () =>
      io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
      }),
    []
  );

  // Add connection status logging
  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket connected with ID:", socket.id);
        setIsConnected(true);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });
    }
  }, [socket]);

  // Join meeting room and handle socket events
  useEffect(() => {
    if (id && user?.user?.username) {
      socket.emit("join", {
        meetingId: id,
        username: user.user.username,
      });
    }

    socket.on("debateState", (state) => {
      setIsRecording(state.isRecording);
      setTimeLeft(state.timeLeft);
      setInitialTime(state.initialTime);
      setIsDebateActive(state.isDebateActive);
      setShowSettings(state.showSettings);
      if (state.currentSpeaker) {
        const speaker = participants.find(
          (p) => p.userId === state.currentSpeaker
        );
        if (speaker) setCurrentSpeaker(speaker);
      }
    });

    socket.on("currentSegment", (segment) => {
      setCurrentSegment(segment);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, user?.user?.username, participants]);

  // Update server when local state changes
  useEffect(() => {
    if (id) {
      socket.emit("updateDebateState", {
        meetingId: id,
        state: {
          currentSpeaker: currentSpeaker?.userId || null,
          isRecording,
          timeLeft,
          initialTime,
          isDebateActive,
          showSettings,
          currentSegment,
        },
      });
    }
  }, [
    currentSpeaker,
    isRecording,
    timeLeft,
    initialTime,
    isDebateActive,
    showSettings,
    id,
  ]);

  // Update server when current segment changes
  useEffect(() => {
    if (id && currentSegment) {
      socket.emit("updateCurrentSegment", {
        meetingId: id,
        segment: currentSegment,
      });
    }
  }, [currentSegment, id]);

  // Use the Stream transcription hook
  const {
    transcript: streamTranscript,
    currentSegment: streamCurrentSegment,
    getAllTranscripts: getStreamTranscripts,
    clearTranscript: clearStreamTranscript,
    assignSpeakerToSegment,
    switchSpeaker: switchStreamSpeaker,
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
        const newTimeLeft = timeLeft - 1;
        const newState = {
          isRecording,
          timeLeft: newTimeLeft,
          initialTime,
          showSettings,
          isDebateActive,
          currentSpeaker: currentSpeaker?.userId || null,
          currentSegment,
        };

        socket.emit("updateDebateState", {
          meetingId: id,
          state: newState,
        });

        setTimeLeft(newTimeLeft);
      }, 1000);
    } else if (timeLeft === 0) {
      if (currentSegment.trim() && currentSpeaker) {
        const newSegment: TranscriptSegment = {
          text: currentSegment,
          speakerId: currentSpeaker.userId,
          timestamp: new Date().toISOString(),
        };

        setSpeakerTranscripts((prev) => ({
          ...prev,
          [currentSpeaker.userId]: [
            ...(prev[currentSpeaker.userId] || []),
            newSegment,
          ],
        }));
        analyzeSegment(currentSegment);
      }
      setIsRecording(false);
      switchStreamSpeaker(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  // Effect to handle participants
  useEffect(() => {
    const subscription = call?.state.participants$.subscribe((participants) => {
      setParticipants(participants);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [call]);

  // Update current speaker when participants change
  useEffect(() => {
    if (participants.length > 0 && !currentSpeaker) {
      setCurrentSpeaker(participants[0]);
    }
  }, [participants, currentSpeaker]);

  const startRecording = async () => {
    try {
      const newState = {
        timeLeft,
      };

      socket.emit("updateDebateState", {
        meetingId: id,
        state: newState,
      });

      setIsRecording(true);
      setTimeLeft(initialTime);
      setShowSettings(false);
      setIsDebateActive(true);
      clearStreamTranscript();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    const newState = {
      timeLeft,
    };

    socket.emit("updateDebateState", {
      meetingId: id,
      state: newState,
    });

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentSegment.trim() && currentSpeaker) {
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker.userId,
        timestamp: new Date().toISOString(),
      };

      setSpeakerTranscripts((prev) => ({
        ...prev,
        [currentSpeaker.userId]: [
          ...(prev[currentSpeaker.userId] || []),
          newSegment,
        ],
      }));
      analyzeSegment(currentSegment);
    }
  };

  const switchSpeaker = async () => {
    if (currentSegment.trim() && currentSpeaker) {
      const newSegment: TranscriptSegment = {
        text: currentSegment,
        speakerId: currentSpeaker.userId,
        timestamp: new Date().toISOString(),
      };

      // Wait for 2 seconds before appending the transcript
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSpeakerTranscripts((prev) => ({
        ...prev,
        [currentSpeaker.userId]: [
          ...(prev[currentSpeaker.userId] || []),
          newSegment,
        ],
      }));
      analyzeSegment(currentSegment);
    }

    const newSpeaker = participants.find(
      (p) => p.userId !== currentSpeaker?.userId
    );
    if (newSpeaker) {
      setCurrentSpeaker(newSpeaker);
      // Use the participant's index for switchStreamSpeaker
      const speakerIndex = participants.findIndex(
        (p) => p.userId === newSpeaker.userId
      );
      switchStreamSpeaker(speakerIndex);
    }
    setTimeLeft(initialTime);
  };

  const analyzeSegment = async (text: string) => {
    if (!text.trim()) return;

    if (text.length < 20) {
      console.log("Text too short for analysis!");
      return;
    }

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
          context: { source: "debate", speaker: currentSpeaker?.userId },
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
        // Convert the API response to our Fallacy format and append to existing fallacies
        const newFallacies: Fallacy[] = data.analysis.fallacies.map(
          (fallacy: any) => ({
            type: fallacy.type,
            description: fallacy.description,
            fix: fallacy.fix,
            timestamp: new Date().toISOString(),
            speakerId: currentSpeaker?.userId || "",
          })
        );

        console.log("Appending new fallacies:", newFallacies);
        setFallacies((prev) => [...prev, ...newFallacies]);
      } else {
        // No fallacies detected in this segment, but keep existing fallacies
        console.log("No fallacies detected in this segment");
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
    const newTime = minutes * 60;
    const newState = {
      isRecording,
      timeLeft: newTime,
      initialTime: newTime,
      showSettings,
      isDebateActive,
      currentSpeaker: currentSpeaker?.userId || null,
      currentSegment,
    };

    socket.emit("updateDebateState", {
      meetingId: id,
      state: newState,
    });

    setInitialTime(newTime);
    setTimeLeft(newTime);
  };

  // Get the current speaker's transcript
  const getCurrentTranscript = () => {
    return currentSpeaker
      ? speakerTranscripts[currentSpeaker.userId] || []
      : [];
  };

  // Get all transcripts in chronological order
  const getAllTranscripts = () => {
    const allTranscripts = Object.values(speakerTranscripts).flat();
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
      if (isRecording) {
        stopRecording();
      }

      if (currentSegment.trim() && currentSpeaker) {
        const newSegment: TranscriptSegment = {
          text: currentSegment,
          speakerId: currentSpeaker.userId,
          timestamp: new Date().toISOString(),
        };

        setSpeakerTranscripts((prev) => ({
          ...prev,
          [currentSpeaker.userId]: [
            ...(prev[currentSpeaker.userId] || []),
            newSegment,
          ],
        }));
      }

      const allFallacies = fallacies.map((item) => ({
        speaker:
          participants.find((p) => p.userId === item.speakerId)?.name ||
          "Unknown",
        fallacy: item.type,
        fix: item.fix,
        timestamp: item.timestamp,
        description: item.description,
      }));

      const transcripts = Object.entries(speakerTranscripts).reduce(
        (acc, [userId, segments]) => {
          const speaker = participants.find((p) => p.userId === userId);
          if (speaker) {
            acc[speaker.name] = segments.map((seg) => seg.text).join(" ");
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const summary: DebateSummary = {
        transcripts,
        fallacies: allFallacies,
      };

      setDebateSummary(summary);

      const data = JSON.stringify({
        transcript: speakerTranscripts,
        analysis: allFallacies,
        participants: participants.map((p) => p.name),
        metadata: {
          duration: initialTime - timeLeft,
          timestamp: new Date().toISOString(),
        },
      });

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
    setDebateSummary(null);
    setSpeakerTranscripts({});
    setFallacies([]);
    setCurrentSegment("");
    setTimeLeft(initialTime);
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
              {Object.entries(debateSummary.transcripts).map(
                ([speakerName, transcript]) => (
                  <div
                    key={speakerName}
                    className="bg-[#1F2937] p-4 rounded-lg border border-[#2C3E50]"
                  >
                    <h3 className="text-lg font-semibold text-[#2563EB] mb-2">
                      {speakerName}
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto">
                      <p className="text-[#E5E7EB]">{transcript}</p>
                    </div>
                  </div>
                )
              )}
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
                {currentSpeaker?.name || "Waiting for speaker..."}
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
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleTimeChange(3)}
                      className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                    >
                      3 min
                    </Button>
                    <Button
                      onClick={() => handleTimeChange(5)}
                      className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                    >
                      5 min
                    </Button>
                    <Button
                      onClick={() => handleTimeChange(10)}
                      className="bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] border border-[#2C3E50]"
                    >
                      10 min
                    </Button>
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
                            segment.speakerId === currentSpeaker?.userId
                              ? "text-[#2563EB]"
                              : "text-[#9CA3AF]"
                          }`}
                        >
                          {segment.speakerId === currentSpeaker?.userId
                            ? "Current Speaker"
                            : "Other Speaker"}
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
                                item.speakerId === currentSpeaker?.userId
                                  ? "text-[#2563EB]"
                                  : "text-[#9CA3AF]"
                              }`}
                            >
                              {item.speakerId === currentSpeaker?.userId
                                ? "Current Speaker"
                                : "Other Speaker"}
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

export default DebateContent;
