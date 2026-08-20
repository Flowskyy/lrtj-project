import { NextResponse } from 'next/server';

// Fixed type options as per project requirements
const TYPE_OPTIONS = ["News", "Pers"];

export async function GET() {
  try {
    return NextResponse.json(TYPE_OPTIONS);
  } catch (error) {
    console.error('Failed to fetch news types:', error);
    return NextResponse.json({ error: 'Failed to fetch types' }, { status: 500 });
  }
}
