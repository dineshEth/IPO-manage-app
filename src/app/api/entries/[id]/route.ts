import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';
import { Role, EntryStatus, AllotmentStatus } from '@/types/prisma';

// GET single entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const entry = await prisma.iPOEntry.findUnique({
      where: { id },
      include: {
        ipo: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this entry
    if (user.role !== 'SUPER_ADMIN' && entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own entries' },
        { status: 403 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('GET entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update entry (super admin can update status and allotment)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { status, allotmentStatus, requestedDeletion, deletionApproved } = await request.json();

    const entry = await prisma.iPOEntry.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own entries' },
        { status: 403 }
      );
    }

    // Regular users can only request deletion
    if (user.role !== 'SUPER_ADMIN') {
      if (requestedDeletion !== undefined) {
        const updatedEntry = await prisma.iPOEntry.update({
          where: { id },
          data: { requestedDeletion },
        });
        return NextResponse.json({
          message: 'Deletion request updated successfully',
          entry: updatedEntry,
        });
      }
      return NextResponse.json(
        { error: 'Forbidden - Only super admin can update entry status' },
        { status: 403 }
      );
    }

    // Super admin can update status and allotment
    const updatedEntry = await prisma.iPOEntry.update({
      where: { id },
      data: {
        status: status || entry.status,
        allotmentStatus: allotmentStatus || entry.allotmentStatus,
        requestedDeletion: requestedDeletion !== undefined ? requestedDeletion : entry.requestedDeletion,
        deletionApproved: deletionApproved !== undefined ? deletionApproved : entry.deletionApproved,
      },
    });

    // If deletion is approved, delete the entry
    if (updatedEntry.deletionApproved) {
      await prisma.iPOEntry.delete({ where: { id } });
      return NextResponse.json({
        message: 'Entry deleted successfully',
      });
    }

    return NextResponse.json({
      message: 'Entry updated successfully',
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('PUT entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE entry (super admin only or users can request deletion)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const entry = await prisma.iPOEntry.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'SUPER_ADMIN' && entry.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own entries' },
        { status: 403 }
      );
    }

    // If regular user, just mark as requested for deletion
    if (user.role !== 'SUPER_ADMIN') {
      const updatedEntry = await prisma.iPOEntry.update({
        where: { id },
        data: { requestedDeletion: true },
      });
      return NextResponse.json({
        message: 'Deletion request sent to super admin',
        entry: updatedEntry,
      });
    }

    // Super admin can delete directly
    await prisma.iPOEntry.delete({ where: { id } });

    return NextResponse.json({
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('DELETE entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
