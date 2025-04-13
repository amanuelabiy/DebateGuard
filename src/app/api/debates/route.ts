import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { title, speaker1, speaker2, transcript, fallacies, summary } = await request.json();

    if (!title || !speaker1 || !speaker2 || !transcript || !fallacies || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save the debate to the database
    const debate = await prisma.debate.create({
      data: {
        title,
        speaker1,
        speaker2,
        transcript: JSON.stringify(transcript),
        fallacies: JSON.stringify(fallacies),
        summary,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ debate });
  } catch (error) {
    console.error('Error saving debate:', error);
    return NextResponse.json(
      { error: 'Failed to save debate' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Retrieve all debates from the database
    const debates = await prisma.debate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse the JSON strings back to objects
    const formattedDebates = debates.map(debate => ({
      ...debate,
      transcript: JSON.parse(debate.transcript as string),
      fallacies: JSON.parse(debate.fallacies as string),
    }));

    return NextResponse.json({ debates: formattedDebates });
  } catch (error) {
    console.error('Error retrieving debates:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve debates' },
      { status: 500 }
    );
  }
} 