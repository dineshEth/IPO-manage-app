#!/usr/bin/env node
/**
 * Database initialization script
 * Checks if database exists, creates it if not, and seeds it
 */

const { existsSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

const dbPath = join(__dirname, '..', 'prisma', 'dev.db');

console.log('Checking database...');

if (!existsSync(dbPath)) {
  console.log('Database not found. Creating database and seeding...');
  
  try {
    console.log('Running prisma db push...');
    execSync('npx prisma db push', { 
      cwd: __dirname + '/..',
      stdio: 'inherit'
    });
    
    console.log('Running prisma db seed...');
    execSync('npx prisma db seed', { 
      cwd: __dirname + '/..',
      stdio: 'inherit'
    });
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
} else {
  console.log('Database already exists. Skipping initialization.');
}
