import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.merchandise_category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
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
    const { category_name, status } = body;

    if (!category_name || category_name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await prisma.merchandise_category.update({
      where: { id: parseInt(id) },
      data: {
        category_name: category_name.trim(),
        status: status !== undefined ? status : true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    if (force) {
      // Unassign and deactivate instead of force delete
      await prisma.$transaction(async (tx) => {
        // First unassign all merchandise items from this category
        await tx.merchandise.updateMany({
          where: { category_id: parseInt(id) },
          data: { category_id: null },
        });
        // Then deactivate the category instead of deleting it
        await tx.merchandise_category.update({
          where: { id: parseInt(id) },
          data: { status: false },
        });
      });
      return NextResponse.json({ success: true, unassignedAndDeactivated: true });
    }

    // Normal delete attempt (should fail due to FK constraint)
    try {
      await prisma.merchandise_category.delete({
        where: { id: parseInt(id) },
      });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Query affected merchandise items
        const affectedItems = await prisma.merchandise.findMany({
          where: { category_id: parseInt(id) },
          select: { id: true, name: true },
        });

        return NextResponse.json(
          {
            error: 'This category is still used by existing merchandise items. Use force delete to unassign items and deactivate the category.',
            affectedItems: affectedItems.map(item => ({ id: item.id, name: item.name })),
            forceDeleteAvailable: true,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
