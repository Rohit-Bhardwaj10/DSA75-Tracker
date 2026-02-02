import { prisma } from './prisma';

/**
 * Get the current challenge day based on IST timezone
 * Returns null if outside the 75-day challenge period
 */
export async function getCurrentChallengeDay() {
  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  // Get date only (YYYY-MM-DD)
  const todayDate = istTime.toISOString().split('T')[0];
  
  const challengeDay = await prisma.challengeDay.findFirst({
    where: {
      date: new Date(todayDate)
    }
  });
  
  return challengeDay;
}

/**
 * Check if a user can submit for today
 * Rules:
 * - Must be within challenge period
 * - Cannot have already submitted for today
 * - Must be before midnight IST
 */
export async function canUserSubmitToday(userId: string) {
  const currentDay = await getCurrentChallengeDay();
  
  if (!currentDay) {
    return { canSubmit: false, reason: 'Not within challenge period' };
  }
  
  // Check if already submitted
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      userId_challengeDayId: {
        userId,
        challengeDayId: currentDay.id
      }
    }
  });
  
  if (existingSubmission) {
    return { canSubmit: false, reason: 'Already submitted for today' };
  }
  
  return { canSubmit: true, challengeDay: currentDay };
}

/**
 * Validate submission data based on day type
 */
export function validateSubmissionData(
  dsaLink: string,
  xPostLink: string | null,
  contestLink: string | null,
  isSunday: boolean
) {
  const errors: string[] = [];
  
  // DSA link is always required
  if (!dsaLink || !dsaLink.trim()) {
    errors.push('DSA question link is required');
  }
  
  // Validate URL format
  if (dsaLink && !isValidUrl(dsaLink)) {
    errors.push('DSA link must be a valid URL');
  }
  
  // Sunday-only fields
  // if (!isSunday) {
  //   if (xPostLink) {
  //     errors.push('X post link can only be submitted on Sundays');
  //   }
  //   if (contestLink) {
  //     errors.push('Contest link can only be submitted on Sundays');
  //   }
  // } else {
  //   // On Sundays, validate if provided
  //   if (xPostLink && !isValidUrl(xPostLink)) {
  //     errors.push('X post link must be a valid URL');
  //   }
  //   if (contestLink && !isValidUrl(contestLink)) {
  //     errors.push('Contest link must be a valid URL');
  //   }
  // }
  
  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
