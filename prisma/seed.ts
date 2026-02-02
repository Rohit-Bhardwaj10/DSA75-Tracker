import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production seed...');

  // Get challenge start date from env or use default
  // Ideally this should be set in .env for production
  const startDateStr = process.env.CHALLENGE_START_DATE || new Date().toISOString().split('T')[0];
  const startDate = new Date(startDateStr);

  console.log(`Challenge start date: ${startDateStr}`);

  // Create 75 challenge days
  console.log('Creating 75 challenge days...');
  
  for (let i = 1; i <= 75; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (i - 1));
    
    const isSunday = currentDate.getDay() === 0;
    
    await prisma.challengeDay.upsert({
      where: { dayNumber: i },
      update: {
        date: currentDate,
        isSunday
      },
      create: {
        dayNumber: i,
        date: currentDate,
        isSunday
      }
    });
  }

  console.log('✅ Created all 75 challenge days');

  // Create admin user
  console.log('Creating admin user...');
  
  const adminPassword = await hashPassword('admin123'); // You should change this password immediately after login!
  
  await prisma.user.upsert({
    where: { email: 'admin@dsa75.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@dsa75.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Created default admin user (email: admin@dsa75.com)');

  // Create demo users
  console.log('Creating demo users...');

  const demoUsers = [
    { name: 'Alice Chen', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' },
    { name: 'Charlie Kim', email: 'charlie@example.com' }
  ];

  const commonPassword = await hashPassword('password123');
  const challengeDays = await prisma.challengeDay.findMany({ orderBy: { dayNumber: 'asc' }, take: 10 });

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: commonPassword,
        role: 'USER'
      }
    });

    console.log(`Created user: ${u.name}`);

    // Create random submissions for each user (for the first few days)
    // Alice is very consistent (All days)
    // Bob is sporadic (Days 1, 3, 4)
    // Charlie is just starting (Day 1)
    
    let daysToSubmit: number[] = [];
    if (u.name.includes('Alice')) {
      daysToSubmit = [1, 2, 3, 4, 5];
      // Find a Sunday to add
      const sunday = challengeDays.find(d => d.isSunday);
      if (sunday) daysToSubmit.push(sunday.dayNumber);
    }
    if (u.name.includes('Bob')) daysToSubmit = [1, 3, 4];
    if (u.name.includes('Charlie')) daysToSubmit = [1];

    for (const dayNum of daysToSubmit) {
      const day = challengeDays.find(d => d.dayNumber === dayNum);
      if (!day) continue;

      const submission = await prisma.submission.upsert({
        where: {
          userId_challengeDayId: {
            userId: user.id,
            challengeDayId: day.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          challengeDayId: day.id,
          dsaLink: 'https://leetcode.com/problems/two-sum',
          difficulty: dayNum % 3 === 0 ? 'Hard' : dayNum % 2 === 0 ? 'Medium' : 'Easy',
          xPostLink: day.isSunday ? 'https://x.com/alice/status/123' : null,
          contestLink: day.isSunday ? 'leetcode.com/contest/123' : null,
          submittedAt: new Date(day.date.getTime() + 1000 * 60 * 60 * 12) // Noon on that day
        }
      });

      // Score them (Admin usually does this, but we'll seed it)
      await prisma.score.upsert({
        where: { submissionId: submission.id },
        update: {},
        create: {
          submissionId: submission.id,
          dsaScore: 5,
          xPostScore: day.isSunday ? 2 : 0,
          contestScore: day.isSunday ? 5 : 0,
          totalScore: 5 + (day.isSunday ? 7 : 0)
        }
      });
    }
  }

  console.log('✅ Created demo users with submissions');
  console.log('⚠️  IMPORTANT: Change the admin password upon first login!');
  
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
