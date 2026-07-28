import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const categories = await prisma.merchandise_category.findMany({
      where: all ? undefined : { status: true },
      select: {
        id: true,
        category_name: true,
        status: all ? true : undefined,
        created_at: all ? true : undefined,
        updated_at: all ? true : undefined,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category_name, status } = body;

    if (!category_name || category_name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const category = await prisma.merchandise_category.create({
      data: {
        category_name: category_name.trim(),
        status: status !== undefined ? status : true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
