import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding... 🌱');

  // Delete old data (if needed)
  // await prisma.calculation.deleteMany();
  // await prisma.refreshToken.deleteMany();
  // await prisma.user.deleteMany();

  // Creating Test User
  const passwordHash = await bcrypt.hash('password123', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash,
    },
  });

  console.log('Created test user:', testUser.email);

  // Creating a couple fake calculations for history
  await prisma.calculation.create({
    data: {
      userId: testUser.id,
      brand: 'Toyota',
      model: 'Camry',
      region: 'Kyiv',
      yearFrom: 2018,
      yearTo: 2020,
      avgPrice: 18500,
      avgMileage: 85000,
      photoUrl:
        'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-604019_1280.jpg',
    },
  });

  await prisma.calculation.create({
    data: {
      userId: testUser.id,
      brand: 'BMW',
      model: 'X5',
      region: 'Lviv',
      yearFrom: 2015,
      yearTo: 2017,
      avgPrice: 25000,
      avgMileage: 120000,
      photoUrl:
        'https://cdn.pixabay.com/photo/2016/11/22/23/44/bmw-1851315_1280.jpg',
    },
  });

  console.log('Seeding completed successfully! ✅');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
