import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Create a test debate session
    const session = await prisma.debateSession.create({
      data: {
        title: 'Test Debate',
        topic: 'Testing Database Connection',
        transcript: {
          create: {
            content: 'This is a test transcript'
          }
        },
        summary: {
          create: {
            content: 'This is a test summary'
          }
        }
      },
      include: {
        transcript: true,
        summary: true
      }
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test database connection' },
      { status: 500 }
    );
  }
} 