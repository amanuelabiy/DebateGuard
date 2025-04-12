import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream API credentials not configured" },
        { status: 500 }
      );
    }
    
    // Generate a token with proper timing
    const userId = "user-" + crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour expiration
    
    // Create JWT token manually
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      user_id: userId,
      exp,
      iat: now,
      iss: apiKey
    })).toString("base64url");
    
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    
    const token = `${header}.${payload}.${signature}`;
    
    return NextResponse.json({ token, apiKey, userId });
  } catch (error) {
    console.error("Error generating Stream token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
} 