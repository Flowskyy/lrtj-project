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
    const statusCounts = await prisma.redeem_benefit.groupBy({
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

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search && search.trim()) {
    const searchNum = parseInt(search.trim());
    const searchConditions: any[] = [];

    if (!isNaN(searchNum)) {
      searchConditions.push({ id: searchNum });
      searchConditions.push({ user_id: searchNum });
      searchConditions.push({ merchant_id: searchNum });
    }

    searchConditions.push({ name: { contains: search.trim() } });
    searchConditions.push({ email: { contains: search.trim() } });

    where.OR = searchConditions;
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'updated_at') {
    orderBy.updated_at = order;
  } else {
    orderBy.id = 'desc';
  }

  const [redeemBenefits, total] = await Promise.all([
    prisma.redeem_benefit.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.redeem_benefit.count({ where }),
  ]);

  // Get status counts for stat cards
  const statusCounts = await prisma.redeem_benefit.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const statusCountMap = new Map(
    statusCounts.map(sc => [sc.status, sc._count.id])
  );

  return NextResponse.json({
    data: redeemBenefits,
    meta: {
      total,
      statusCounts: Object.fromEntries(statusCountMap),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
