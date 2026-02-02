import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get('day');
    const userId = searchParams.get('userId');
    const userName = searchParams.get('name');

    // Build query
    const where: any = {};
    
    if (dayNumber) {
      where.challengeDay = {
        dayNumber: parseInt(dayNumber)
      };
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (userName) {
      where.user = {
        name: {
          contains: userName,
          mode: 'insensitive'
        }
      };
    }

    // Get all submissions with filters
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        challengeDay: true,
        score: true
      },
      orderBy: [
        {
          challengeDay: {
            dayNumber: 'desc'
          }
        },
        {
          submittedAt: 'desc'
        }
      ]
    });

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Admin get submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
