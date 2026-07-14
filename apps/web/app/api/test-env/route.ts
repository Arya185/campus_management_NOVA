import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    uri: process.env.MONGODB_URI,
    db: process.env.MONGODB_DB_NAME
  });
}
