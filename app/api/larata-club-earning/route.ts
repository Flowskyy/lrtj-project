import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const debug = searchParams.get('debug');
    const exportMode = searchParams.get('export') === 'true';

    // Debug mode: return distinct category and type values
    if (debug === 'values') {
      const categories = await prisma.slc_earning_history.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });
      const types = await prisma.slc_earning_history.findMany({
        select: { type: true },
        distinct: ['type'],
        orderBy: { type: 'asc' },
      });
      return NextResponse.json({
        categories: categories.map(c => c.category),
        types: types.map(t => t.type),
      });
    }

  const where: any = {};

  if (category && category !== 'all') {
    where.category = category;
  }

  if (type && type !== 'all') {
    where.type = type;
  }

  if (dateFrom) {
    where.created_at = { ...where.created_at, gte: new Date(dateFrom) };
  }

  if (dateTo) {
    where.created_at = { ...where.created_at, lte: new Date(dateTo + 'T23:59:59') };
  }

  if (search && search.trim()) {
    const searchConditions: any[] = [];

    // Search by user name or email - need to find matching user IDs first
    const matchingUsers = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: search.trim() } },
          { email: { contains: search.trim() } },
        ],
      },
      select: { id: true },
      take: 100,
    });

    if (matchingUsers.length > 0) {
      searchConditions.push({
        user_id: {
          in: matchingUsers.map(u => u.id),
        },
      });
    }

    // Only set OR if we have conditions, otherwise return empty results
    if (searchConditions.length > 0) {
      where.OR = searchConditions;
    } else {
      // No matching users found, return empty results
      where.id = -1; // This will match nothing
    }
  }

  const orderBy: any = {};
  if (sortBy === 'id') {
    orderBy.id = order;
  } else if (sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'earning_point') {
    orderBy.earning_point = order;
  } else {
    orderBy.created_at = 'desc';
  }

  const [earnings, total] = await Promise.all([
    prisma.slc_earning_history.findMany({
      where,
      orderBy,
      skip: exportMode ? 0 : (page - 1) * limit,
      take: exportMode ? undefined : limit,
    }),
    prisma.slc_earning_history.count({ where }),
  ]);

  // Get user information for manual join
  const userIds = earnings.map(e => e.user_id).filter(Boolean);
  
  let users: Array<{ id: number; name: string | null; email: string | null }> = [];
  if (userIds.length > 0) {
    users = await prisma.users.findMany({
      where: {
        id: { in: userIds as number[] },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  const userMap = new Map(
    users.map(u => [u.id, { name: u.name, email: u.email }])
  );

  // Merge user information into earnings
  const earningsWithUser = earnings.map(earning => ({
    ...earning,
    id: earning.id.toString(), // Convert BigInt to string
    user_name: userMap.get(earning.user_id)?.name || 'Unknown',
    user_email: userMap.get(earning.user_id)?.email || 'Unknown',
  }));

  return NextResponse.json({
    data: earningsWithUser,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
