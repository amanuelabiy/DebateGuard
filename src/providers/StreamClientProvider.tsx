"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import Loader from "@/components/Loader";
import { streamTokenProvider } from "@/actions/stream.actions";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";

const StreamClientProvider = ({ children }: { children: ReactNode }) => {
  const [streamVideoClient, setStreamVideoClient] =
    useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();

  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      user: {
        id: user?.id,
        name: user?.firstName || "" + " " + user?.lastName || "" || user?.id,
        image: user?.imageUrl,
      },
      tokenProvider: streamTokenProvider,
    });

    setStreamVideoClient(client);
  }, [user, isLoaded]);

  if (!user) {
    return;
  }

  if (!streamVideoClient) return <Loader />;

  if (!streamVideoClient && isLoaded)
    return <div>Failed to connect to Stream</div>;

  return <StreamVideo client={streamVideoClient}>{children}</StreamVideo>;
};

export default StreamClientProvider;
