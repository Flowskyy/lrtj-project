import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.daily_benefit.findUnique({
    where: { id: parseInt(id) },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const updatedItem = await prisma.daily_benefit.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      redeem_point: data.redeem_point,
      image_url: data.image_url,
      term_condition: data.term_condition,
      editedBy: data.editedBy,
      status: data.status,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      is_active: data.is_active,
      updated_at: new Date(),
    },
  });

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.daily_benefit.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: 'Item deleted' });
}
