import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const {
      transcript,
      analysis,
      participants,
      metadata
    } = await request.json();

    if (!transcript || !analysis) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save debate session to database
    const debateSession = await prisma.debateSession.create({
      data: {
        transcript,
        analysis,
        participants: participants || [],
        metadata: metadata || {},
        status: "completed"
      }
    });

    return NextResponse.json(debateSession);
  } catch (error) {
    console.error('Error saving debate session:', error);
    return NextResponse.json(
      { error: 'Failed to save debate session' },
      { status: 500 }
    );
  }
} 