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
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id
      },
      include: {
        challengeDay: true,
        score: true
      },
      orderBy: {
        challengeDay: {
          dayNumber: 'asc'
        }
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
