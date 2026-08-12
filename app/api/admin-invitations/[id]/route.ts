import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invitationId = parseInt(id);
    if (isNaN(invitationId)) {
      return NextResponse.json({ error: 'Invalid invitation id' }, { status: 400 });
    }

    // Hard delete: removes the row entirely, which invalidates the invite token
    // (any signup link for it will 404 / "Invalid invitation link")
    await prisma.admin_invitations.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    );
  }
}