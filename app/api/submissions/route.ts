import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { canUserSubmitToday, validateSubmissionData } from '@/lib/challenge';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (!user || user.role !== 'USER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get submission data
    const body = await request.json();
    const { dsaLink, xPostLink, contestLink, difficulty } = body;

    // Check if user can submit today
    const { canSubmit, reason, challengeDay } = await canUserSubmitToday(user.id);

    if (!canSubmit) {
      return NextResponse.json(
        { error: reason },
        { status: 400 }
      );
    }

    // Validate submission data
    const errors = validateSubmissionData(
      dsaLink,
      xPostLink || null,
      contestLink || null,
      challengeDay!.isSunday
    );

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        challengeDayId: challengeDay!.id,
        dsaLink: dsaLink.trim(),
        difficulty: difficulty || 'Medium',
        xPostLink: xPostLink?.trim() || null,
        contestLink: contestLink?.trim() || null
      },
      include: {
        challengeDay: true
      }
    });

    return NextResponse.json({
      message: 'Submission created successfully',
      submission
    }, { status: 201 });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only see their own submissions
    const limitDate = new Date();
    
    // 1. Fetch all challenge days up to today
    const challengeDays = await prisma.challengeDay.findMany({
      where: { date: { lte: limitDate } },
      orderBy: { dayNumber: 'asc' }
    });

    // 2. Fetch actual submissions
    const rawSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id
      },
      include: {
        challengeDay: true,
        score: true
      }
    });

    // 3. Merge to ensure every day is shown
    const submissions = challengeDays.map(day => {
      const sub = rawSubmissions.find(s => s.challengeDayId === day.id);
      
      if (sub) {
        return sub;
      } else {
        // Create a virtual "missed" submission object for display
        return {
          id: `missed-${day.id}`,
          userId: user.id,
          challengeDayId: day.id,
          dsaLink: '',
          difficulty: 'Missed',
          xPostLink: null,
          contestLink: null,
          submittedAt: day.date, // Use day date for sorting/display
          challengeDay: day,
          score: {
            dsaScore: -5,
            xPostScore: 0,
            contestScore: 0,
            totalScore: -5
          }
        };
      }
    });

    return NextResponse.json({ submissions });

  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
