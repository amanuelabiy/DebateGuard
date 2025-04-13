import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { meetingId, text, timestamp } = await req.json();

    if (!meetingId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or update the transcript for this meeting
    const transcript = await prisma.transcript.upsert({
      where: {
        debateSessionId: meetingId,
      },
      create: {
        debateSessionId: meetingId,
        content: text,
      },
      update: {
        content: {
          append: "\n" + text,
        },
      },
    });

    return NextResponse.json({ success: true, data: transcript });
  } catch (error) {
    console.error("Error saving transcript segment:", error);
    return NextResponse.json(
      { error: "Failed to save transcript segment" },
      { status: 500 }
    );
  }
} 