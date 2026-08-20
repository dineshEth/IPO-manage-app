import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Role, EntryStatus } from '@/types/prisma';

// GET all entries for the current user (or all if super admin)
export async function GET(request: NextRequest) {
  try {
    let token = cookies().get('token')?.value;
    
    // Also check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

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

    let entries;

    if (user.role === 'SUPER_ADMIN') {
      // Super admin can see all entries
      entries = await prisma.iPOEntry.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          ipo: {
            select: {
              id: true,
              name: true,
              symbol: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });
    } else {
      // Regular users can only see their own entries
      entries = await prisma.iPOEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          ipo: {
            select: {
              id: true,
              name: true,
              symbol: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('GET entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new entry (users can create for themselves, super admin can create for anyone)
export async function POST(request: NextRequest) {
  try {
    let token = cookies().get('token')?.value;
    
    // Also check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

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

    const { ipoId, upiId, userId } = await request.json();

    // Check if IPO exists
    const ipo = await prisma.iPO.findUnique({ where: { id: ipoId } });

    if (!ipo) {
      return NextResponse.json(
        { error: 'IPO not found' },
        { status: 404 }
      );
    }

    // Determine who the entry is for
    const targetUserId = user.role === 'SUPER_ADMIN' && userId ? userId : user.id;

    // Check if entry already exists for this user and IPO
    const existingEntry = await prisma.iPOEntry.findUnique({
      where: {
        ipoId_userId: {
          ipoId,
          userId: targetUserId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Entry already exists for this IPO and user' },
        { status: 400 }
      );
    }

    const entry = await prisma.iPOEntry.create({
      data: {
        ipoId,
        userId: targetUserId,
        upiId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'IPO entry created successfully',
      entry,
    });
  } catch (error) {
    console.error('POST entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
