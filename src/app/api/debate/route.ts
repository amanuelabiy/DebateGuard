import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      console.log("User is not auth");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { transcript, analysis, participants, metadata } = body;

    if (!transcript || !analysis || !participants || !metadata) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the transcript arrays from the object
    const transcriptArrays = Object.values(transcript);
    const speaker1Data = transcriptArrays[0] || [];
    const speaker2Data = transcriptArrays[1] || [];

    const debate = await prisma.debateSession.create({
      data: {
        status: "completed",
        metadata: {
          ...metadata,
          participants,
          userId: user.id,
        },
        transcript: {
          create: {
            speaker1: speaker1Data,
            speaker2: speaker2Data,
          },
        },
        analysis: {
          create: {
            fallacies: analysis,
          },
        },
      },
      include: {
        transcript: true,
        analysis: true,
      },
    });

    console.log("Debate created:", debate);
    return NextResponse.json(debate);
  } catch (error) {
    console.error("[DEBATE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
