import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json([]);
  }

  try {
    const members = await prisma.member.findMany({
      where: {
        nama: {
          contains: query.trim(),
        },
        status: 1, // Only active members
      },
      select: {
        id_member: true,
        nama: true,
        email: true,
      },
      take: 10,
      orderBy: {
        nama: 'asc',
      },
    });

    return NextResponse.json(
      members.map((member) => ({
        id: member.id_member,
        name: member.nama,
        email: member.email,
      }))
    );
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json([], { status: 500 });
  }
}
