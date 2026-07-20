import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_member: string }> }
) {
  const { id_member } = await params;
  const item = await prisma.users.findUnique({
    where: { id: parseInt(id_member) },
  });

  if (!item) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check for related redeem records
  const redeemCount = await prisma.redeem.count({
    where: { user_id: parseInt(id_member) },
  });

  return NextResponse.json({ ...item, redeemCount });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id_member: string }> }
) {
  const { id_member } = await params;
  const data = await request.json();

  try {
    const updatedItem = await prisma.users.update({
      where: { id: parseInt(id_member) },
      data: {
        name: data.nama || data.name,
        email: data.email,
        no_telepon: data.telepon || data.no_telepon,
        alamat: data.alamat,
        jenis_kelamin: data.jenis_kelamin,
        nik: data.nik,
        tempat_lahir: data.tempat_lahir,
        birthday: data.birthday ? new Date(data.birthday) : null,
        status: data.status,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id_member: string }> }
) {
  const { id_member } = await params;

  try {
    // Check for related redeem records
    const redeemCount = await prisma.redeem.count({
      where: { user_id: parseInt(id_member) },
    });

    await prisma.users.delete({
      where: { id: parseInt(id_member) },
    });

    return NextResponse.json({ 
      success: true, 
      message: redeemCount > 0 
        ? `User deleted. Warning: ${redeemCount} related redeem record(s) will become orphaned.` 
        : 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
