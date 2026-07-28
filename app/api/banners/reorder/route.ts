import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: items array is required' },
        { status: 400 }
      );
    }

    // Update all banner sequences in a single transaction
    await prisma.$transaction(
      items.map((item: { id: number; sequence: number }) =>
        prisma.banners.update({
          where: { id: item.id },
          data: { sequence: item.sequence, updated_at: new Date() },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering banners:', error);
    return NextResponse.json(
      { error: 'Failed to reorder banners' },
      { status: 500 }
    );
  }
}
