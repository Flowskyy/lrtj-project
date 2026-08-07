import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatWIB } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    // Use raw SQL for consistent WIB formatting
    const popups = await prisma.$queryRaw`
      SELECT
        id, description, image_url, sequence, created_by,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM popups
      ORDER BY sequence ASC
    ` as any[];

    return NextResponse.json(popups);
  } catch (error) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { description, image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get the next sequence number
    const maxSequence = await prisma.$queryRaw`
      SELECT sequence FROM popups ORDER BY sequence DESC LIMIT 1
    ` as any[];

    const nextSequence = (maxSequence[0]?.sequence ?? 0) + 1;

    // Use raw SQL to store WIB time literally without timezone conversion
    await prisma.$queryRaw`
      INSERT INTO popups (description, image_url, sequence, created_at, updated_at, created_by)
      VALUES (
        ${description || null},
        ${image_url},
        ${nextSequence},
        ${formatWIB(new Date())},
        ${formatWIB(new Date())},
        ${session?.user?.name || null}
      )
    `;

    // Fetch the new item with proper WIB formatting
    const popup = await prisma.$queryRaw`
      SELECT
        id, description, image_url, sequence, created_by,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM popups
      ORDER BY id DESC
      LIMIT 1
    ` as any[];

    return NextResponse.json(popup[0], { status: 201 });
  } catch (error) {
    console.error('Error creating popup:', error);
    return NextResponse.json(
      { error: 'Failed to create popup' },
      { status: 500 }
    );
  }
}
