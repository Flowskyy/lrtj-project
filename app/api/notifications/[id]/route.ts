import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.notifications.findUnique({
    where: { id: parseInt(id) },
  });

  if (!item) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  // Parse payload JSON if it exists
  let payloadData = null;
  if (item.payload) {
    try {
      payloadData = JSON.parse(item.payload);
    } catch (e) {
      // If payload is not JSON, leave as-is
      payloadData = item.payload;
    }
  }

  const serialized = {
    ...item,
    payload: payloadData,
  };
  
  return NextResponse.json(serialized);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.notifications.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  // Store payload directly as JSON (or null if empty)
  const customPayload = data.payload || null;
  const payloadJson = customPayload ? JSON.stringify(customPayload) : null;

  const updatedItem = await prisma.notifications.update({
    where: { id: parseInt(id) },
    data: {
      title: data.title,
      description: data.description,
      payload: payloadJson,
      // user_id remains null (broadcast only)
      // created_at is not updated on edit
    },
  });

  // Parse updated payload for response
  let payloadData = null;
  if (updatedItem.payload) {
    try {
      payloadData = JSON.parse(updatedItem.payload);
    } catch (e) {
      // If payload is not JSON, leave as-is
      payloadData = updatedItem.payload;
    }
  }

  const serialized = {
    ...updatedItem,
    payload: payloadData,
  };

  return NextResponse.json(serialized);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const existing = await prisma.notifications.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  await prisma.notifications.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: 'Notification deleted' });
}
