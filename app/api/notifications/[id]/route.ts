import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

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
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.notifications.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Parse existing payload for before state
    let beforePayloadData = null;
    if (existing.payload) {
      try {
        beforePayloadData = JSON.parse(existing.payload);
      } catch (e) {
        beforePayloadData = existing.payload;
      }
    }

    const beforeState = {
      ...existing,
      payload: beforePayloadData,
    };

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

    // Calculate changed fields
    const changedFields = Object.keys(data).filter(key => {
      const beforeVal = (beforeState as Record<string, any>)[key];
      const afterVal = (serialized as Record<string, any>)[key];
      return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'notifications',
      recordId: id,
      action: 'UPDATE',
      beforeState,
      afterState: serialized,
      changedFields: changedFields.length > 0 ? changedFields : undefined,
    });

    return NextResponse.json(serialized);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withActivityContextFromSession(async (userId, userName, userEmail, roleId, roleName) => {
    const { id } = await params;
    
    const existing = await prisma.notifications.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Parse existing payload for before state
    let beforePayloadData = null;
    if (existing.payload) {
      try {
        beforePayloadData = JSON.parse(existing.payload);
      } catch (e) {
        beforePayloadData = existing.payload;
      }
    }

    const beforeState = {
      ...existing,
      payload: beforePayloadData,
    };

    await prisma.notifications.delete({
      where: { id: parseInt(id) },
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'notifications',
      recordId: id,
      action: 'DELETE',
      beforeState,
    });

    return NextResponse.json({ message: 'Notification deleted' });
  });
}
