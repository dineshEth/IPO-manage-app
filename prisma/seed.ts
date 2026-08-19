import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { username: 'dineshkumar' },
    update: {},
    create: {
      username: 'dineshkumar',
      name: 'Dinesh Kumar',
      password: await bcrypt.hash('Jaipur@2026', 10),
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super admin created:', superAdmin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
