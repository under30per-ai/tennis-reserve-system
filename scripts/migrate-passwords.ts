/**
 * Migrates all plaintext passwords to scrypt hashes.
 * Idempotent — already-hashed passwords are skipped.
 *
 * Usage: npm run db:migrate-passwords
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { hashPassword, isHashedPassword } from '../src/lib/password';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const rows = await db.select({ id: schema.members.id, password: schema.members.password }).from(schema.members);

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (isHashedPassword(row.password)) {
      skipped++;
      continue;
    }

    const hashed = await hashPassword(row.password);
    await db
      .update(schema.members)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(schema.members.id, row.id));
    migrated++;
  }

  console.log(`Done. Migrated: ${migrated}, Already hashed (skipped): ${skipped}, Total: ${rows.length}`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
