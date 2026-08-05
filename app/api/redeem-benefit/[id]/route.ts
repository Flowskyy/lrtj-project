import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const item = await prisma.redeem_benefit.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return NextResponse.json({ error: 'Redeem benefit record not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching redeem benefit:', error);
    return NextResponse.json({ error: 'Failed to fetch redeem benefit record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.redeem_benefit.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting redeem benefit:', error);
    return NextResponse.json({ error: 'Failed to delete redeem benefit record' }, { status: 500 });
  }
}
