import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Role } from '@/types/prisma';

// GET all IPOs
export async function GET(request: NextRequest) {
  try {
    // Optional: Add auth check if needed for GET requests
    // For now, keeping it public as per existing behavior
    const ipos = await prisma.iPO.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ ipos });
  } catch (error) {
    console.error('GET IPOs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST new IPO (Super Admin only)
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

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admin can create IPOs' },
        { status: 403 }
      );
    }

    const {
      name,
      symbol,
      startDate,
      endDate,
      rumorGMP,
      price,
      lotSize,
      costInRupees,
      status,
      listingDate,
      allotmentDate,
    } = await request.json();

    const ipo = await prisma.iPO.create({
      data: {
        name,
        symbol,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rumorGMP: rumorGMP ? parseFloat(rumorGMP) : undefined,
        price: parseFloat(price),
        lotSize: parseInt(lotSize),
        costInRupees: parseFloat(costInRupees),
        status: status || 'PENDING',
        listingDate: listingDate ? new Date(listingDate) : undefined,
        allotmentDate: allotmentDate ? new Date(allotmentDate) : undefined,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      message: 'IPO created successfully',
      ipo,
    });
  } catch (error) {
    console.error('POST IPO error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
