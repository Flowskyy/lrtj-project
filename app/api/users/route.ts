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

  const where: any = {};

  if (status && status !== 'all') {
    where.status = parseInt(status);
  }

  if (gender && gender !== 'all') {
    where.jenis_kelamin = gender;
  }

  if (verified && verified !== 'all') {
    if (verified === 'verified') {
      where.verified_at = { not: null };
    } else if (verified === 'unverified') {
      where.verified_at = null;
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

  const [users, total, activeCount, inactiveCount, verifiedCount, unverifiedCount] = await Promise.all([
    prisma.users.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.users.count({ where }),
    prisma.users.count({ where: { status: 1 } }),
    prisma.users.count({ where: { status: 0 } }),
    prisma.users.count({ where: { verified_at: { not: null } } }),
    prisma.users.count({ where: { verified_at: null } }),
  ]);

  return NextResponse.json({
    data: users,
    meta: {
      total,
      active: activeCount,
      inactive: inactiveCount,
      verified: verifiedCount,
      unverified: unverifiedCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const newItem = await prisma.users.create({
    data: {
      name: data.nama || data.name || '',
      email: data.email || '',
      no_telepon: data.telepon || data.no_telepon || '',
      alamat: data.alamat || '',
      password: data.password || '',
      status: data.status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
      slc_point: 0,
      trip_count: 0,
      member_level_id: 2,
      ecard: '',
      ecard2: '',
      google_id: '',
      apple_id: '',
    },
  });

  return NextResponse.json(newItem);
}
