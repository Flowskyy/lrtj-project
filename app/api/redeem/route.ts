import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search');
  const debug = searchParams.get('debug');

  // Debug mode: return distinct status values
  if (debug === 'status') {
    const statusCounts = await prisma.redeem.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      orderBy: {
        status: 'asc',
      },
    });
    return NextResponse.json(statusCounts);
  }

  // Autocomplete suggestions mode
  const suggest = searchParams.get('suggest');
  if (suggest && suggest.trim()) {
    const query = suggest.trim();
    
    // Get matching merchandise names (top 5)
    const merchandiseMatches = await prisma.merchandise.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      select: {
        name: true,
      },
      take: 5,
      distinct: ['name'],
    });

    // Get matching receiver names (top 5)
    const receiverMatches = await prisma.redeem.findMany({
      where: {
        receiver_name: {
          contains: query,
        },
      },
      select: {
        receiver_name: true,
      },
      take: 5,
      distinct: ['receiver_name'],
    });

    return NextResponse.json({
      merchandise: merchandiseMatches.map(m => m.name),
      users: receiverMatches.map(r => r.receiver_name),
    });
  }

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search && search.trim()) {
    const searchNum = parseInt(search.trim());
    const searchConditions: any[] = [];

    if (!isNaN(searchNum)) {
      searchConditions.push({ id: searchNum });
    }

    searchConditions.push({ receiver_name: { contains: search.trim() } });

    // For merchandise name search, we need to find matching merchandise IDs first
    const matchingMerchandise = await prisma.merchandise.findMany({
      where: {
        name: {
          contains: search.trim(),
        },
      },
      select: {
        id: true,
      },
      take: 100,
    });

    if (matchingMerchandise.length > 0) {
      searchConditions.push({
        merchandise_id: {
          in: matchingMerchandise.map(m => m.id),
        },
      });
    }

    where.OR = searchConditions;
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = order;
  } else if (sortBy === 'updatedAt') {
    orderBy.updatedAt = order;
  } else {
    orderBy.id = 'desc';
  }

  const [redeems, total, pendingCount, completedCount] = await Promise.all([
    prisma.redeem.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.redeem.count({ where }),
    prisma.redeem.count({ where: { status: 'process' } }),
    prisma.redeem.count({ where: { status: 'completed' } }),
  ]);

  // Get merchandise names for manual join
  const merchandiseIds = redeems.map(r => r.merchandise_id).filter(Boolean);
  const merchandiseItems = await prisma.merchandise.findMany({
    where: {
      id: { in: merchandiseIds as number[] },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const merchandiseMap = new Map(
    merchandiseItems.map(m => [m.id, m.name])
  );

  // Merge merchandise names into redeems
  const redeemsWithMerchandise = redeems.map(redeem => ({
    ...redeem,
    merchandise_name: merchandiseMap.get(redeem.merchandise_id) || 'Unknown',
  }));

  return NextResponse.json({
    data: redeemsWithMerchandise,
    meta: {
      total,
      pending: pendingCount,
      completed: completedCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
