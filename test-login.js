#!/usr/bin/env node
/**
 * Test script to verify login works with database initialization
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database initialization and login...\n');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username: 'dineshkumar' },
    });
    
    if (!user) {
      console.error('❌ FAIL: User dineshkumar does not exist in database');
      return;
    }
    
    console.log('✓ User dineshkumar exists in database');
    
    // Test password
    const isPasswordValid = await bcrypt.compare('Jaipur@2026', user.password);
    
    if (!isPasswordValid) {
      console.error('❌ FAIL: Password does not match');
      return;
    }
    
    console.log('✓ Password is correct');
    console.log('\n✅ Database initialization is working correctly!');
    console.log('\nYou should now be able to login with:');
    console.log('  Username: dineshkumar');
    console.log('  Password: Jaipur@2026');
    
  } catch (error) {
    console.error('❌ FAIL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
