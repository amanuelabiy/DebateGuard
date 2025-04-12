import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, segment } = body;

    // If no conversationId is provided, create a new conversation
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: {},
      });
      return NextResponse.json(conversation);
    }

    // If segment is provided, add it to the existing conversation
    if (segment) {
      const { text, timestamp } = segment;
      const newSegment = await prisma.segment.create({
        data: {
          text,
          timestamp: new Date(timestamp),
          conversationId,
        },
      });
      return NextResponse.json(newSegment);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error in conversations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          segments: {
            orderBy: {
              timestamp: "asc",
            },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation);
    }

    // If no conversationId is provided, return all conversations
    const conversations = await prisma.conversation.findMany({
      include: {
        segments: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error in conversations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 