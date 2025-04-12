import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { StreamChat } from "stream-chat";

const useMeetingActions = () => {
  const router = useRouter();

  const createInstantMeeting = async () => {
    try {
      // Get Stream token
      const tokenResponse = await fetch('/api/stream');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get Stream token');
      }
      const { token, apiKey, userId } = await tokenResponse.json();
      
      // Initialize Stream client with token
      const client = StreamChat.getInstance(apiKey);
      await client.connectUser(
        {
          id: userId,
        },
        token
      );
      
      const id = crypto.randomUUID();
      router.push(`/meeting/${id}`);
      toast.success("Meeting Created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create meeting");
    }
  };

  const joinMeeting = (callId: string) => {
    router.push(`/meeting/${callId}`);
  };

  return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions; 