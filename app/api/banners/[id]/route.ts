import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await prisma.banners.findUnique({
      where: { id: parseInt(id) },
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const banner = await prisma.banners.update({
      where: { id: parseInt(id) },
      data: {
        description: description || null,
        image_url,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the sequence of the banner being deleted
    const deletedBanner = await prisma.banners.findUnique({
      where: { id: parseInt(id) },
      select: { sequence: true },
    });

    if (!deletedBanner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Delete the banner
    await prisma.banners.delete({
      where: { id: parseInt(id) },
    });

    // Re-sequence remaining banners to keep them contiguous
    const remainingBanners = await prisma.banners.findMany({
      where: { sequence: { gt: deletedBanner.sequence } },
      orderBy: { sequence: 'asc' },
    });

    // Update sequence values in a transaction
    await prisma.$transaction(
      remainingBanners.map((banner) =>
        prisma.banners.update({
          where: { id: banner.id },
          data: { sequence: banner.sequence - 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
