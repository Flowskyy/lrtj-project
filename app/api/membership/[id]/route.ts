import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const membershipId = parseInt(id);
    const body = await request.json();
    const { min_trip, reward_tap_out } = body;

    if (isNaN(membershipId)) {
      return NextResponse.json({ error: 'Invalid membership ID' }, { status: 400 });
    }

    // Only allow updating min_trip and reward_tap_out
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        min_trip: min_trip !== undefined ? parseInt(min_trip) : undefined,
        reward_tap_out: reward_tap_out !== undefined ? parseInt(reward_tap_out) : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json({ error: 'Failed to update membership' }, { status: 500 });
  }
}
