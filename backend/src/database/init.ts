import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { prisma } from './db.js';
import { seedDatabase } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSchemaPath(): string {
  const possibilities = [
    path.resolve(process.cwd(), 'prisma/schema.prisma'),
    path.resolve(process.cwd(), 'backend/prisma/schema.prisma'),
    path.resolve(__dirname, '../../prisma/schema.prisma'),
    path.resolve(__dirname, '../../../prisma/schema.prisma'),
    path.resolve(__dirname, '../prisma/schema.prisma')
  ];

  for (const p of possibilities) {
    if (fs.existsSync(p)) return p;
  }
  return path.resolve(process.cwd(), 'prisma/schema.prisma');
}

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
        const schemaPath = getSchemaPath();
        const schemaDir = path.dirname(path.dirname(schemaPath));
        console.log(`Executing Prisma push using schema: ${schemaPath}`);

        execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`, {
          stdio: 'inherit',
          cwd: schemaDir,
          env: process.env
        });

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
