import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const source = searchParams.get('source'); // 'users' or 'redeem'

  if (!query || !query.trim()) {
    return NextResponse.json([]);
  }

  try {
    if (source === 'redeem') {
      // Search in redeem table for past receiver names
      const receivers = await prisma.redeem.findMany({
        where: {
          receiver_name: {
            contains: query.trim(),
          },
        },
        select: {
          receiver_name: true,
          receiver_phone: true,
          receiver_email: true,
          receiver_address: true,
        },
        take: 10,
        distinct: ['receiver_name'],
        orderBy: {
          created_at: 'desc',
        },
      });

      // Map to UserOption format (using receiver_name as both id and name since redeem doesn't have user_id for autocomplete)
      const results = receivers.map((r, index) => ({
        id: index, // Temporary ID since we're searching by name, not by user_id
        name: r.receiver_name || '',
        email: r.receiver_email || '',
        phone: r.receiver_phone || '',
        address: r.receiver_address || '',
      }));

      return NextResponse.json(results);
    }

    // Default: Search in users table for real customer data
    const users = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: query.trim() } },
          { email: { contains: query.trim() } },
          { no_telepon: { contains: query.trim() } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        no_telepon: true,
        alamat: true,
      },
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
    });

    // Map users results to the expected UserOption format
    const results = users.map((user) => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.no_telepon || '',
      address: user.alamat || '',
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json([], { status: 500 });
  }
}
