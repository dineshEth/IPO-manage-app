import { PrismaClient } from '@/types/prisma';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

// Initialize database with seed data if it doesn't exist
async function initializeDatabase(): Promise<void> {
  // Use a flag to prevent multiple initializations across module reloads
  if (globalForPrisma.dbInitialized) {
    return;
  }

  try {
    const prismaInstance = globalForPrisma.prisma || new PrismaClient();
    
    // Check if any users exist
    const userCount = await prismaInstance.user.count();
    
    if (userCount === 0) {
      console.log('[DB INIT] No users found. Seeding database with default admin user...');
      
      // Create default super admin user
      await prismaInstance.user.upsert({
        where: { username: 'dineshkumar' },
        update: {},
        create: {
          username: 'dineshkumar',
          name: 'Dinesh Kumar',
          password: await bcrypt.hash('Jaipur@2026', 10),
          role: 'SUPER_ADMIN',
        },
      });
      
      console.log('[DB INIT] Database seeded with default admin user: dineshkumar');
    } else {
      console.log('[DB INIT] Database already contains users. Skipping seed.');
    }
  } catch (error) {
    console.error('[DB INIT] Error initializing database:', error);
    // Don't fail the application if initialization fails
  } finally {
    globalForPrisma.dbInitialized = true;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Run initialization immediately when module is loaded
// This ensures the database is checked and seeded on first request
initializeDatabase().catch((e) => {
  console.error('[DB INIT] Initial database initialization failed:', e);
});

export default prisma;
