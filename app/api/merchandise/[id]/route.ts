import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Use raw SQL for consistent WIB formatting
  const item = await prisma.$queryRaw`
    SELECT
      m.id, m.name, m.points, m.image_url, m.description, m.editedBy, m.status, m.category_id,
      DATE_FORMAT(m.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
      DATE_FORMAT(m.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
      c.id as category_id, c.category_name
    FROM merchandise m
    LEFT JOIN merchandise_category c ON m.category_id = c.id
    WHERE m.id = ${parseInt(id)}
  ` as any[];

  if (!item || item.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const itemWithCategory = {
    ...item[0],
    category: item[0]?.category_id ? {
      id: item[0].category_id,
      category_name: item[0].category_name
    } : null,
    category_id: item[0]?.category_id
  };

  return NextResponse.json(itemWithCategory);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  try {
    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      UPDATE merchandise 
      SET name = ${data.name},
          points = ${data.points},
          image_url = ${data.image_url},
          description = ${data.description},
          editedBy = ${data.editedBy},
          status = ${data.status},
          category_id = ${data.category_id},
          updatedAt = ${formatWIB(new Date())}
      WHERE id = ${parseInt(id)}
    `;

    // Fetch the updated item with proper WIB formatting
    const updatedItem = await prisma.$queryRaw`
      SELECT
        m.id, m.name, m.points, m.image_url, m.description, m.editedBy, m.status, m.category_id,
        DATE_FORMAT(m.createdAt, '%Y-%m-%dT%H:%i:%s') as createdAt,
        DATE_FORMAT(m.updatedAt, '%Y-%m-%dT%H:%i:%s') as updatedAt,
        c.id as category_id, c.category_name
      FROM merchandise m
      LEFT JOIN merchandise_category c ON m.category_id = c.id
      WHERE m.id = ${parseInt(id)}
    ` as any[];

    const itemWithCategory = {
      ...updatedItem[0],
      category: updatedItem[0]?.category_id ? {
        id: updatedItem[0].category_id,
        category_name: updatedItem[0].category_name
      } : null,
      category_id: updatedItem[0]?.category_id
    };

    return NextResponse.json(itemWithCategory);
  } catch (error) {
    console.error('Error updating merchandise:', error);
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update merchandise' },
      { status: 500 }
    );
  }
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
