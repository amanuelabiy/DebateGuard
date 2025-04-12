import { ReactNode, useEffect, useState } from "react";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import Loader from "@/components/Loader";

interface DebateStreamProviderProps {
  children: ReactNode;
}

export default function DebateStreamProvider({ children }: DebateStreamProviderProps) {
  const [call, setCall] = useState<any>(null);
  const [isCallLoading, setIsCallLoading] = useState(true);
  const client = useStreamVideoClient();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!client || !isLoaded || !user) return;

    const setupCall = async () => {
      try {
        const id = crypto.randomUUID();
        const newCall = client.call("default", id);
        await newCall.getOrCreate({
          data: {
            starts_at: new Date().toISOString(),
            custom: {
              description: "Debate Session",
            },
          },
        });
        setCall(newCall);
      } catch (error) {
        console.error("Error setting up call:", error);
      } finally {
        setIsCallLoading(false);
      }
    };

    setupCall();
  }, [client, user, isLoaded]);

  if (!isLoaded || isCallLoading) return <Loader />;
  if (!call) return <div>Failed to create debate session</div>;

  return (
    <StreamCall call={call}>
      <StreamTheme>
        {children}
      </StreamTheme>
    </StreamCall>
  );
} 