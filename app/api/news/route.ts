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
    where.publish_date = {};
    if (dateFrom) {
      where.publish_date.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.publish_date.lte = new Date(dateTo);
    }
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'publish_date') {
    orderBy.publish_date = order;
  } else if (sortBy === 'views') {
    orderBy.views = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else {
    orderBy.id = 'desc';
  }

  const [items, totalCount, activeCount, inactiveCount] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy,
    }),
    prisma.news.count(),
    prisma.news.count({ where: { status: 1 } }),
    prisma.news.count({ where: { status: 0 } }),
  ]);

  // Convert BigInt to string for JSON serialization
  const serializedItems = items.map(item => ({
    ...item,
    views: item.views.toString(),
  }));

  return NextResponse.json({
    data: serializedItems,
    meta: {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const newItem = await prisma.news.create({
    data: {
      title: data.title,
      title_en: data.title_en,
      content: data.content || '<p>-</p>',
      content_en: data.content_en || '<p>-</p>',
      img_url: data.img_url || '',
      caption_image: data.caption_image || '',
      type: data.type || 'general',
      status: data.status ?? 1,
      publish_date: data.publish_date ? new Date(data.publish_date) : new Date(),
      createdBy: data.createdBy,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return NextResponse.json(newItem);
}
