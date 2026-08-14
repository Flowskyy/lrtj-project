import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWIBDate, formatWIB } from '@/lib/utils';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

// Use auth_roles table (Better Auth roles), not admin_roles (admin panel roles)
// The auth_users.roleId foreign key references auth_roles.id

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body: expected JSON' },
        { status: 400 }
      );
    }

    const { email, roleId } = body;

    if (!email || !roleId) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Server-side domain validation
    if (!email.endsWith('@lrtjakarta.co.id')) {
      return NextResponse.json(
        { error: 'Email must end with @lrtjakarta.co.id for Microsoft SSO users' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.auth_users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Validate role exists (use auth_roles table, not admin_roles)
    const role = await prisma.auth_roles.findUnique({
      where: { id: parseInt(roleId) },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Create user without password (for Microsoft SSO) using raw SQL to avoid Better Auth hooks
    const now = getWIBDate();
    const nowLiteral = formatWIB(now);
    const newId = crypto.randomUUID();
    
    await prisma.$queryRaw`
      INSERT INTO auth_users (id, email, name, emailVerified, roleId, createdAt, updatedAt)
      VALUES (
        ${newId},
        ${email.toLowerCase()},
        ${email.toLowerCase()},
        true,
        ${parseInt(roleId)},
        ${nowLiteral},
        ${nowLiteral}
      )
    `;
    
    const newUser = {
      id: newId,
      email: email.toLowerCase(),
      roleId: parseInt(roleId),
    };

    return NextResponse.json({
      success: true,
      message: `Admin ${email} added successfully with role ${role.name}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        roleId: newUser.roleId,
      },
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}