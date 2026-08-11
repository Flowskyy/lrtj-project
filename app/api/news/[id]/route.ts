import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';
import { withActivityContextFromSession } from '@/lib/activity-middleware';
import { logManualActivity } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Use raw SQL for consistent WIB formatting
  const item = await prisma.$queryRaw`
    SELECT
      id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
      DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
      DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
    FROM news
    WHERE id = ${parseInt(id)}
  ` as any[];

  if (!item || item.length === 0) {
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  }

  // Fetch creator email if createdBy exists
  let creatorEmail = null;
  if (item[0].createdBy) {
    const creator = await prisma.auth_users.findFirst({
      where: { name: item[0].createdBy },
      select: { email: true },
    });
    creatorEmail = creator?.email || null;
  }

  const serialized = {
    ...item[0],
    views: item[0].views ? item[0].views.toString() : '0',
    creatorEmail: creatorEmail || null,
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
    
    // Fetch the before state
    const beforeItem = await prisma.$queryRaw`
      SELECT
        id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
        DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM news
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!beforeItem || beforeItem.length === 0) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      UPDATE news 
      SET title = ${data.title},
          title_en = ${data.title_en},
          content = ${data.content},
          content_en = ${data.content_en},
          img_url = ${data.img_url},
          caption_image = ${data.caption_image},
          type = ${data.type},
          status = ${data.status},
          publish_date = ${formatWIB(data.publish_date)},
          updated_at = ${formatWIB(new Date())}
      WHERE id = ${parseInt(id)}
    `;

    // Fetch the updated item with proper WIB formatting
    const updatedItem = await prisma.$queryRaw`
      SELECT
        id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
        DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM news
      WHERE id = ${parseInt(id)}
    ` as any[];

    const serialized = {
      ...updatedItem[0],
      views: updatedItem[0]?.views ? updatedItem[0].views.toString() : '0',
    };

    // Calculate changed fields
    const changedFields = Object.keys(data).filter(key => {
      const beforeVal = beforeItem[0][key];
      const afterVal = updatedItem[0][key];
      return JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'news',
      recordId: id,
      action: 'UPDATE',
      beforeState: beforeItem[0],
      afterState: serialized,
      changedFields,
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
    
    // Fetch the before state
    const beforeItem = await prisma.$queryRaw`
      SELECT
        id, title, title_en, content, content_en, img_url, caption_image, type, status, views, createdBy,
        DATE_FORMAT(publish_date, '%Y-%m-%dT%H:%i:%s') as publish_date,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM news
      WHERE id = ${parseInt(id)}
    ` as any[];

    if (!beforeItem || beforeItem.length === 0) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    await prisma.news.delete({
      where: { id: parseInt(id) },
    });

    // Log the activity manually since we're using raw SQL
    await logManualActivity({
      tableName: 'news',
      recordId: id,
      action: 'DELETE',
      beforeState: beforeItem[0],
    });

    return NextResponse.json({ message: 'News deleted' });
  });
}
