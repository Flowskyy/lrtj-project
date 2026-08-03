import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'desc';

  const where: any = {
    user_id: null, // HARD FILTER: Only broadcast notifications
  };

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'title') {
    orderBy.title = order;
  } else {
    orderBy.id = 'desc';
  }

  const [items, totalCount] = await Promise.all([
    prisma.notifications.findMany({
      where,
      orderBy,
    }),
    prisma.notifications.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    meta: {
      total: totalCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  // ALWAYS force user_id to null for broadcast notifications
  // Ignore any user_id from the request body
  const newItem = await prisma.notifications.create({
    data: {
      title: data.title,
      description: data.description,
      payload: null, // Always null for now
      user_id: null, // Hardcoded to ensure broadcast-only
      created_at: new Date(),
    },
  });

  return NextResponse.json(newItem);
}
