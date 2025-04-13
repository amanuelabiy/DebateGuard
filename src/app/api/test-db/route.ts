import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Try to connect to the database
    await prisma.$connect();
    
    // Return a success message
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Return an error message
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
  }
} 