import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
  
export async function GET(request: Request) {
  try {
    const welcomePoint = await prisma.welcome_point.findFirst({
      orderBy: {
        id: 'asc',
      },
    });

    if (!welcomePoint) {
      return NextResponse.json(
        { error: 'No welcome point configuration found' },
        { status: 404 }
      );
    }

    return NextResponse.json(welcomePoint);
  } catch (error) {
    console.error('Error fetching welcome point:', error);
    return NextResponse.json(
      { error: 'Failed to fetch welcome point configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { point, active_from, active_to, updated_by } = body;

    if (point === undefined || point === null) {
      return NextResponse.json(
        { error: 'Point value is required' },
        { status: 400 }
      );
    }

    if (!updated_by) {
      return NextResponse.json(
        { error: 'Updated by information is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.welcome_point.findFirst({
      orderBy: {
        id: 'asc',
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No welcome point configuration found to update' },
        { status: 404 }
      );
    }

    const updated = await prisma.welcome_point.update({
      where: {
        id: existing.id,
      },
      data: {
        point: point,
        active_from: active_from ? active_from.toString() : null,
        active_to: active_to ? active_to.toString() : null,
        updated_by: updated_by,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating welcome point:', error);
    return NextResponse.json(
      { error: 'Failed to update welcome point configuration' },
      { status: 500 }
    );
  }
}
