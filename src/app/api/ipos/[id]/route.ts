import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Role, IPOStatus } from '@/types/prisma';

// GET single IPO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ipo = await prisma.iPO.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        entries: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ipo) {
      return NextResponse.json(
        { error: 'IPO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ipo });
  } catch (error) {
    console.error('GET IPO error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update IPO (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Forbidden - Only super admin can update IPOs' },
        { status: 403 }
      );
    }

    const { id } = await params;

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

    const existingIPO = await prisma.iPO.findUnique({ where: { id } });

    if (!existingIPO) {
      return NextResponse.json(
        { error: 'IPO not found' },
        { status: 404 }
      );
    }

    const ipo = await prisma.iPO.update({
      where: { id },
      data: {
        name: name || existingIPO.name,
        symbol: symbol || existingIPO.symbol,
        startDate: startDate ? new Date(startDate) : existingIPO.startDate,
        endDate: endDate ? new Date(endDate) : existingIPO.endDate,
        rumorGMP: rumorGMP !== undefined ? parseFloat(rumorGMP) : existingIPO.rumorGMP,
        price: price ? parseFloat(price) : existingIPO.price,
        lotSize: lotSize ? parseInt(lotSize) : existingIPO.lotSize,
        costInRupees: costInRupees ? parseFloat(costInRupees) : existingIPO.costInRupees,
        status: status || existingIPO.status,
        listingDate: listingDate ? new Date(listingDate) : existingIPO.listingDate,
        allotmentDate: allotmentDate ? new Date(allotmentDate) : existingIPO.allotmentDate,
      },
    });

    return NextResponse.json({
      message: 'IPO updated successfully',
      ipo,
    });
  } catch (error) {
    console.error('PUT IPO error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE IPO (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Forbidden - Only super admin can delete IPOs' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingIPO = await prisma.iPO.findUnique({ where: { id } });

    if (!existingIPO) {
      return NextResponse.json(
        { error: 'IPO not found' },
        { status: 404 }
      );
    }

    await prisma.iPO.delete({ where: { id } });

    return NextResponse.json({
      message: 'IPO deleted successfully',
    });
  } catch (error) {
    console.error('DELETE IPO error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
