import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const types = await prisma.news.findMany({
      select: { type: true },
      where: { type: { not: null } },
      distinct: ['type'],
    });

    const typeValues = types
      .map(t => t.type)
      .filter((t): t is string => t !== null && t !== undefined && t !== '');

    return NextResponse.json(typeValues);
  } catch (error) {
    console.error('Failed to fetch news types:', error);
    return NextResponse.json({ error: 'Failed to fetch types' }, { status: 500 });
  }
}
