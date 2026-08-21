import { prisma, dbInitPromise } from './db';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export interface UserPayload {
  id: string;
  username: string;
  name: string | null;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: UserPayload): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(JWT_SECRET));

  return token;
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userPayload = payload as unknown as UserPayload;
    return userPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<UserPayload | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Wait for database initialization to complete
  await dbInitPromise;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
    },
  });

  return user || null;
}

export async function authenticateUser(username: string, password: string): Promise<UserPayload | null> {
  // Wait for database initialization to complete
  await dbInitPromise;
  
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) return null;

  const isValid = await comparePassword(password, user.password);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}
