import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatWIB } from '@/lib/utils';

// Simple in-memory cache for unfiltered total count (30 second TTL)
let cachedTotal: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

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

  // Build WHERE clause for raw SQL
  const conditions: string[] = [];
  const params: any[] = [];

  if (where.status !== undefined) {
    conditions.push('status = ?');
    params.push(where.status);
  }
  if (where.jenis_kelamin) {
    conditions.push('jenis_kelamin = ?');
    params.push(where.jenis_kelamin);
  }
  if (where.activation_slc !== undefined) {
    conditions.push('activation_slc = ?');
    params.push(where.activation_slc);
  }
  if (where.member_level_id !== undefined) {
    conditions.push('member_level_id = ?');
    params.push(where.member_level_id);
  }
  if (where.created_at) {
    if (where.created_at.gte) {
      conditions.push('created_at >= ?');
      params.push(where.created_at.gte);
    }
    if (where.created_at.lte) {
      conditions.push('created_at <= ?');
      params.push(where.created_at.lte);
    }
  }
  if (where.OR) {
    const orConditions = where.OR.map((cond: any) => {
      const [field, op] = Object.entries(cond)[0];
      const fieldValue = Object.values(cond)[0];
      if (op === 'contains') {
        params.push(`%${fieldValue}%`);
        return `${field} LIKE ?`;
      }
      params.push(fieldValue);
      return `${field} = ?`;
    });
    conditions.push(`(${orConditions.join(' OR ')})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build ORDER BY clause with column whitelist to prevent SQL injection
  const validSortColumns = ['id', 'name', 'email', 'created_at', 'lrtj_saldo', 'slc_point', 'trip_count'];
  const sortColumn = (sortBy && validSortColumns.includes(sortBy)) ? sortBy : 'id';
  const sortDirection = (order === 'asc' ? 'ASC' : 'DESC');
  const orderByClause = `ORDER BY ${sortColumn} ${sortDirection}`;

  // Use raw SQL for consistent WIB formatting
  let users: any[];
  
  if (exportMode) {
    // Batch fetching for large exports to prevent timeout/memory issues
    const batchSize = 50000;
    users = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const batch = await prisma.$queryRawUnsafe(
        `SELECT
          id, email, password, no_telepon, jenis_kelamin, nik, alamat, tempat_lahir, name, image, status, device_token,
          push_notification, email_notification, new_content_notification, google_id, otp, verified_at, activation_slc,
          activation_slc_at, activation_lrtjpay, activation_lrtjpay_at, member_level_id, apple_id, lrtj_token, guid,
          domain, lrtjpay_token, lrtjpay_pin, DATE_FORMAT(birthday, '%Y-%m-%dT%H:%i:%s') as birthday, province_id, regency_id, ecard, ecard2, lrtj_saldo, slc_point, trip_count,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
          DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
        FROM users
        ${whereClause}
        ${orderByClause}
        LIMIT ${offset}, ${batchSize}`,
        ...params
      ) as any[];
      
      users.push(...batch);
      offset += batchSize;
      hasMore = batch.length === batchSize;
    }
  } else {
    // Normal paginated query
    users = await prisma.$queryRawUnsafe(
      `SELECT
        id, email, password, no_telepon, jenis_kelamin, nik, alamat, tempat_lahir, name, image, status, device_token,
        push_notification, email_notification, new_content_notification, google_id, otp, verified_at, activation_slc,
        activation_slc_at, activation_lrtjpay, activation_lrtjpay_at, member_level_id, apple_id, lrtj_token, guid,
        domain, lrtjpay_token, lrtjpay_pin, province_id, regency_id, ecard, ecard2, lrtj_saldo, slc_point, trip_count,
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') as created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s') as updated_at
      FROM users
      ${whereClause}
      ${orderByClause}
      LIMIT ${(page - 1) * limit}, ${limit}`,
      ...params
    ) as any[];
  }

  // Get total count - use approximate count for unfiltered queries for performance
  let total: number;
  const hasFilters = Object.keys(where).length > 0;
  
  if (hasFilters) {
    // Use exact COUNT(*) when filters are applied (necessary and typically faster)
    const totalResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM users ${whereClause}`, ...params) as any[];
    total = Number(totalResult[0]?.count || 0);
  } else {
    // Use cached approximate count for unfiltered queries (instant)
    const now = Date.now();
    if (cachedTotal && (now - cachedTotal.timestamp) < CACHE_TTL) {
      total = cachedTotal.count;
    } else {
      // Cache miss or expired - fetch fresh approximate count
      const approxResult = await prisma.$queryRawUnsafe(
        `SELECT table_rows as count FROM information_schema.tables 
         WHERE table_schema = 'lrt_public_apps' AND table_name = 'users'`
      ) as any[];
      total = Number(approxResult[0]?.count || 0);
      cachedTotal = { count: total, timestamp: now };
    }
  }
  const activeSlcCount = Number(await prisma.users.count({ where: { status: 1, activation_slc: 1 } }));
  const inactiveSlcCount = Number(await prisma.users.count({ where: { status: 1, activation_slc: 0 } }));

  // Manual join for membership only (no FK constraint per business decision) - batched for efficiency
  const memberLevelIds = [...new Set(users.map(u => u.member_level_id).filter(Boolean))];
  
  const membershipMap = new Map<number, string>();
  if (memberLevelIds.length > 0) {
    const memberships = await prisma.membership.findMany({
      where: {
        id: { in: memberLevelIds as number[] },
      },
      select: {
        id: true,
        name: true,
      },
    });
    memberships.forEach(m => {
      membershipMap.set(m.id, m.name);
    });
  }
  
  const usersWithMembership = users.map(user => ({
    ...user,
    member_level_id: user.member_level_id != null ? Number(user.member_level_id) : null,
    province_id: user.province_id != null ? Number(user.province_id) : null,
    regency_id: user.regency_id != null ? Number(user.regency_id) : null,
    slc_point: Number(user.slc_point),
    trip_count: Number(user.trip_count),
    membership_name: user.member_level_id ? (membershipMap.get(Number(user.member_level_id)) || null) : null,
  }));

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
