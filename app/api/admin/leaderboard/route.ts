import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const limitDate = new Date();
    
    // Fetch all challenge days up to today
    const challengeDays = await prisma.challengeDay.findMany({
      where: {
        date: {
          lte: limitDate
        }
      },
      orderBy: { dayNumber: 'asc' }
    });

    // Calculate leaderboard data
    const leaderboard = users.map((user: any) => {
      let totalScore = 0;
      let currentStreak = 0;
      // Index submissions by dayId for faster lookup
      const subMap = new Map();
      user.submissions.forEach((s: any) => subMap.set(s.challengeDayId, s));

      challengeDays.forEach((day: any) => {
        const sub = subMap.get(day.id);
        
        if (sub) {
          // Base score from manual grading
          totalScore += (sub.score?.totalScore || 0);

          // Streak Bonus: +1 for submitting
          currentStreak++;
          totalScore += 1;
        } else {
          // Missed Day Penalty
          totalScore -= 5;
          currentStreak = 0;
        }
      });

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        submissionCount: user.submissions.length,
        totalScore,
        currentStreak // Optionally return streak to show in UI
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
