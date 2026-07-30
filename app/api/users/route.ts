import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const gender = searchParams.get('gender');
  const verified = searchParams.get('verified');
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const exportMode = searchParams.get('export') === 'true';

  const where: any = {};

  if (status === 'active') {
    where.status = 1;
  } else if (status === 'inactive') {
    where.status = 0;
  } else if (status && status !== 'all') {
    // fallback in case a raw numeric value is ever passed directly
    const parsed = parseInt(status);
    if (!isNaN(parsed)) where.status = parsed;
  } else if (!status) {
    // default to active users only, preserving existing behavior
    where.status = 1;
  }
  // if status === 'all', leave where.status unset (no filter)

  if (gender && gender !== 'all') {
    where.jenis_kelamin = gender;
  }

  const activationSlc = searchParams.get('activation_slc');
  if (activationSlc && activationSlc !== 'all') {
    where.activation_slc = parseInt(activationSlc);
  }

  const tier = searchParams.get('tier');
  if (tier && tier !== 'all') {
    where.member_level_id = parseInt(tier);
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.created_at.lte = new Date(dateTo);
    }
  }

  if (search && search.trim()) {
    const searchNum = parseInt(search.trim());
    const searchConditions: any[] = [];

    if (!isNaN(searchNum)) {
      searchConditions.push({ id: searchNum });
    }

    searchConditions.push({ name: { contains: search.trim() } });
    searchConditions.push({ email: { contains: search.trim() } });
    searchConditions.push({ no_telepon: { contains: search.trim() } });

    where.OR = searchConditions;
  }

  const orderBy: any = {};
  if (sortBy === 'id' || sortBy === 'id_member') {
    orderBy.id = order;
  } else if (sortBy === 'nama' || sortBy === 'name') {
    orderBy.name = order;
  } else if (sortBy === 'email') {
    orderBy.email = order;
  } else if (sortBy === 'date_add' || sortBy === 'created_at') {
    orderBy.created_at = order;
  } else if (sortBy === 'lrtj_saldo') {
    orderBy.lrtj_saldo = order;
  } else if (sortBy === 'slc_point') {
    orderBy.slc_point = order;
  } else if (sortBy === 'trip_count') {
    orderBy.trip_count = order;
  } else {
    orderBy.id = 'desc';
  }

  const [users, total, activeSlcCount, inactiveSlcCount] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy,
      skip: exportMode ? 0 : (page - 1) * limit,
      take: exportMode ? undefined : limit,
    }),
    prisma.users.count({ where }),
    prisma.users.count({ where: { status: 1, activation_slc: 1 } }),
    prisma.users.count({ where: { status: 1, activation_slc: 0 } }),
  ]);

  // Manual join for membership only (no FK constraint per business decision)
  const usersWithMembership = await Promise.all(
    users.map(async (user) => {
      let membership = null;
      if (user.member_level_id) {
        membership = await prisma.membership.findUnique({
          where: { id: user.member_level_id },
        });
      }
      return {
        ...user,
        membership_name: membership?.name || null,
      };
    })
  );

  return NextResponse.json({
    data: usersWithMembership,
    meta: {
      total,
      activeSlc: activeSlcCount,
      inactiveSlc: inactiveSlcCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
