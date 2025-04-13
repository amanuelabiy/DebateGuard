import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      console.log("User is not auth");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received body:", body);

    const { transcript, analysis, participants, metadata } = body;

    if (!transcript || !analysis || !participants || !metadata) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

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
            speaker1: transcript.speaker1,
            speaker2: transcript.speaker2,
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

    return NextResponse.json(debate);
  } catch (error) {
    console.error("[DEBATE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
