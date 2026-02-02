import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get score data
    const body = await request.json();
    const { submissionId, dsaScore, xPostScore, contestScore } = body;

    // Validation
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }

    const dsa = parseInt(dsaScore) || 0;
    const xPost = parseInt(xPostScore) || 0;
    const contest = parseInt(contestScore) || 0;
    const total = dsa + xPost + contest;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Upsert score (create or update)
    const score = await prisma.score.upsert({
      where: { submissionId },
      update: {
        dsaScore: dsa,
        xPostScore: xPost,
        contestScore: contest,
        totalScore: total
      },
      create: {
        submissionId,
        dsaScore: dsa,
        xPostScore: xPost,
        contestScore: contest,
        totalScore: total
      }
    });

    return NextResponse.json({
      message: 'Score updated successfully',
      score
    });

  } catch (error) {
    console.error('Score update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
