import { PrismaClient } from '@/types/prisma';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitPromise: Promise<void> | undefined;
};

// Initialize database with seed data if it doesn't exist
async function initializeDatabase(): Promise<void> {
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
  }
}

// Create a singleton initialization promise
export const dbInitPromise = globalForPrisma.dbInitPromise ?? initializeDatabase();
if (process.env.NODE_ENV !== 'production') globalForPrisma.dbInitPromise = dbInitPromise;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Ensure initialization runs immediately
(dbInitPromise as Promise<void>).catch((e) => {
  console.error('[DB INIT] Initial database initialization failed:', e);
});

export default prisma;
