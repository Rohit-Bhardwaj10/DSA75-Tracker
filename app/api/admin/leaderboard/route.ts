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

    const { searchParams } = new URL(request.url);
    const searchName = searchParams.get('name');

    const where: any = {
      role: 'USER'
    };

    if (searchName) {
      where.name = {
        contains: searchName,
        mode: 'insensitive'
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        submissions: {
          include: {
            score: true
          }
        }
      }
    });

    // Calculate leaderboard data
    const leaderboard = users.map((user: any) => {
      const totalScore = user.submissions.reduce((sum: number, sub: any) => {
        return sum + (sub.score?.totalScore || 0);
      }, 0);

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        submissionCount: user.submissions.length,
        totalScore
      };
    }).sort((a: any, b: any) => b.totalScore - a.totalScore);

    return NextResponse.json({ leaderboard });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
