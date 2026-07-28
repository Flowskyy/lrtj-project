import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const banners = await prisma.banners.findMany({
      orderBy: {
        sequence: 'asc',
      },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { description, image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get the next sequence number
    const maxSequence = await prisma.banners.findFirst({
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const nextSequence = (maxSequence?.sequence ?? 0) + 1;

    const banner = await prisma.banners.create({
      data: {
        description: description || null,
        image_url,
        sequence: nextSequence,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: session?.user?.name || null,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
