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
