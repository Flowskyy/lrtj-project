import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const where: any = {};

  if (status === 'active') {
    where.status = 1;
  } else if (status === 'inactive') {
    where.status = 0;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo);
    }
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = order;
  } else if (sortBy === 'editedBy') {
    orderBy.editedBy = order;
  } else {
    orderBy.id = 'asc';
  }

  const [items, totalCount, activeCount, inactiveCount] = await Promise.all([
    prisma.merchandise.findMany({
      where,
      orderBy,
    }),
    prisma.merchandise.count(),
    prisma.merchandise.count({ where: { status: 1 } }),
    prisma.merchandise.count({ where: { status: 0 } }),
  ]);

  return NextResponse.json({
    data: items,
    meta: {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const newItem = await prisma.merchandise.create({
    data: {
      name: data.name,
      points: data.points,
      image_url: data.image_url || '',
      description: data.description || '<p>-</p>',
      editedBy: data.editedBy,
      status: data.status ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(newItem);
}
