import { execSync } from 'child_process';
import { prisma } from './db.js';
import { seedDatabase } from './seed.js';

export async function ensureDatabaseReady(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Database empty. Seeding initial accounts...');
      await seedDatabase();
    }
  } catch (err: any) {
    if (err?.message && (err.message.includes('does not exist') || err.message.includes('no such table'))) {
      console.log('⚠️ SQLite tables missing on deployment host. Auto-migrating schema...');
      try {
        execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
        console.log('✓ Tables generated. Seeding exclusive accounts...');
        await seedDatabase();
        console.log('✓ Database setup complete!');
      } catch (pushErr) {
        console.error('Failed to auto-migrate database schema:', pushErr);
      }
    } else {
      console.error('Database check error:', err);
    }
  }
}
