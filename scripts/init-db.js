#!/usr/bin/env node
/**
 * Database initialization script for MongoDB
 * Seeds the database with initial data
 */

const { execSync } = require('child_process');

console.log('Initializing MongoDB database...');

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
  
  console.log('MongoDB database initialized successfully!');
} catch (error) {
  console.error('Error initializing MongoDB database:', error);
  process.exit(1);
}
