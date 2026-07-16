import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const updated = await prisma.redeem.update({
      where: { id: parseInt(id) },
      data: {
        receiver_name: data.receiver_name,
        receiver_phone: data.receiver_phone,
        receiver_email: data.receiver_email,
        receiver_address: data.receiver_address,
        status: data.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating redeem:', error);
    return NextResponse.json({ error: 'Failed to update redeem record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.redeem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting redeem:', error);
    return NextResponse.json({ error: 'Failed to delete redeem record' }, { status: 500 });
  }
}
