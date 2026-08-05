import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redeemId = parseInt(id);

    if (isNaN(redeemId)) {
      return NextResponse.json({ error: 'Invalid redeem ID' }, { status: 400 });
    }

    const redeem = await prisma.redeem.findUnique({
      where: { id: redeemId },
    });

    if (!redeem) {
      return NextResponse.json({ error: 'Redeem record not found' }, { status: 404 });
    }

    // Get merchandise name
    const merchandise = await prisma.merchandise.findUnique({
      where: { id: redeem.merchandise_id },
      select: { name: true },
    });

    const redeemWithMerchandise = {
      ...redeem,
      merchandise_name: merchandise?.name || 'Unknown',
    };

    return NextResponse.json(redeemWithMerchandise);
  } catch (error) {
    console.error('Error fetching redeem record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redeem record' },
      { status: 500 }
    );
  }
}
