import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';

  const where: any = {};

  if (status === 'active') {
    where.status = 1;
  } else if (status === 'inactive') {
    where.status = 0;
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'createdAt') {
    orderBy.created_at = order;
  } else if (sortBy === 'editedBy') {
    orderBy.editedBy = order;
  } else {
    orderBy.id = 'asc';
  }

  const [items, totalCount, activeCount, inactiveCount] = await Promise.all([
    prisma.daily_benefit.findMany({
      where,
      orderBy,
    }),
    prisma.daily_benefit.count(),
    prisma.daily_benefit.count({ where: { status: 1 } }),
    prisma.daily_benefit.count({ where: { status: 0 } }),
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
  const newItem = await prisma.daily_benefit.create({
    data: {
      name: data.name,
      redeem_point: data.redeem_point,
      image_url: data.image_url || '',
      term_condition: data.term_condition || '<p>-</p>',
      editedBy: data.editedBy,
      status: data.status ?? 1,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      is_active: data.is_active ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return NextResponse.json(newItem);
}
