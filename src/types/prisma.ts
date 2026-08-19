// Type definitions for Prisma string-based enums (SQLite doesn't support native enums)

// String literal types replacing the enums
export type Role = 'SUPER_ADMIN' | 'USER';
export type IPOStatus = 'PENDING' | 'ACTIVE' | 'CLOSED';
export type EntryStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type AllotmentStatus = 'ALLOTED' | 'NOT_ALLOTED';

// Re-export PrismaClient and other types from @prisma/client
export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';
// Export all other types from @prisma/client
export type {
  User,
  IPO,
  IPOEntry,
} from '@prisma/client';
