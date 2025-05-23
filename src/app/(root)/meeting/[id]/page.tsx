"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Loader from "@/components/Loader";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import useGetCallById from "@/hooks/useGetCallById";
import io from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

export default function MeetingsPage() {
  const { id } = useParams();
  const { isLoaded } = useUser();
  const { call, isCallLoading } = useGetCallById(id as string);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const socket = useMemo(
    () =>
      io(socketUrl, {
        transports: ["websocket"],
      }),
    []
  );

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call)
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-2xl font-bold">Call not found</p>
      </div>
    );

  return (
    <div>
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup onSetupComplete={() => setIsSetupComplete(true)} />
          ) : (
            <MeetingRoom />
          )}
        </StreamTheme>
      </StreamCall>
    </div>
  );
}
