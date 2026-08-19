import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getUserFromToken, hashPassword } from '@/lib/auth';

// GET current user profile
export async function GET() {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update current user profile
export async function PUT(request: NextRequest) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { name, password, currentPassword } = await request.json();

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;

    // For password change, verify current password
    if (password && currentPassword) {
      const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
      
      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { comparePassword } = await import('@/lib/auth');
      const isValid = await comparePassword(currentPassword, currentUser.password);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(password);
    } else if (password) {
      return NextResponse.json(
        { error: 'Current password is required for password change' },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('PUT profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
