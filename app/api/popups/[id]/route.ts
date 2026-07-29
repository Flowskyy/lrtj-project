import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const popup = await prisma.popups.findUnique({
      where: { id: parseInt(id) },
    });

    if (!popup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(popup);
  } catch (error) {
    console.error('Error fetching popup:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popup' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await request.json();
    const { description, image_url } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const popup = await prisma.popups.update({
      where: { id: parseInt(id) },
      data: {
        description: description || null,
        image_url,
        updated_at: new Date(),
        updated_by: session?.user?.name || null,
      },
    });

    return NextResponse.json(popup);
  } catch (error) {
    console.error('Error updating popup:', error);
    return NextResponse.json(
      { error: 'Failed to update popup' },
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
    
    // Get the sequence of the popup being deleted
    const deletedPopup = await prisma.popups.findUnique({
      where: { id: parseInt(id) },
      select: { sequence: true },
    });

    if (!deletedPopup) {
      return NextResponse.json(
        { error: 'Popup not found' },
        { status: 404 }
      );
    }

    // Delete the popup
    await prisma.popups.delete({
      where: { id: parseInt(id) },
    });

    // Re-sequence remaining popups to keep them contiguous
    const remainingPopups = await prisma.popups.findMany({
      where: { sequence: { gt: deletedPopup.sequence } },
      orderBy: { sequence: 'asc' },
    });

    // Update sequence values in a transaction
    await prisma.$transaction(
      remainingPopups.map((popup) =>
        prisma.popups.update({
          where: { id: popup.id },
          data: { sequence: popup.sequence - 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting popup:', error);
    return NextResponse.json(
      { error: 'Failed to delete popup' },
      { status: 500 }
    );
  }
}
