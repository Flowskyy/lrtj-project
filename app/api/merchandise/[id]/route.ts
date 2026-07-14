import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.merchandise.findUnique({
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
  const updatedItem = await prisma.merchandise.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      points: data.points,
      image_url: data.image_url,
      description: data.description,
      editedBy: data.editedBy,
      status: data.status,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.merchandise.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: 'Item deleted' });
}
