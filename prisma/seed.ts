/**
 * Seed — ONE admin only: jason@velda.ai
 *   - Temporary password from ADMIN_SEED_PASSWORD (default: password123!)
 *   - 3 sample FL properties attached so the dashboard isn't empty on first login
 *
 * Safe to re-run — upserts by email.
 * >>> Change the password immediately after first login at /settings. <<<
 */
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Better-Auth stores credential passwords as scrypt in "{salt}:{hash}" format
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL || 'jason@velda.ai').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || 'password123!';

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      role: 'ADMIN',
      plan: 'PRO',
      phone: '',
      website: 'https://velda.ai',
      brandColor: '#1d4ed8',
      footerDisclaimer:
        'Licensed Florida real estate professional. Information deemed reliable but not guaranteed.',
    },
  });

  // Upsert the credential Account row for Better-Auth
  const existing = await prisma.account.findFirst({
    where: { userId: admin.id, providerId: 'credential' },
  });
  const hash = hashPassword(password);
  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password: hash } });
  } else {
    await prisma.account.create({
      data: {
        userId: admin.id,
        providerId: 'credential',
        accountId: admin.id,
        password: hash,
      },
    });
  }

  const sample = [
    { address: '123 Ocean Dr', city: 'Miami Beach', state: 'FL', zip: '33139', data: { beds: 2, baths: 2, sqft: 1100, price: 825_000, year: 1998 } },
    { address: '45 Lake Breeze Ln', city: 'Naples', state: 'FL', zip: '34102', data: { beds: 4, baths: 3, sqft: 2650, price: 1_650_000, year: 2016 } },
    { address: '907 Riverside Ct', city: 'Jacksonville', state: 'FL', zip: '32207', data: { beds: 3, baths: 2, sqft: 1825, price: 415_000, year: 2005 } },
  ];
  for (const p of sample) {
    const exists = await prisma.property.findFirst({ where: { userId: admin.id, address: p.address } });
    if (!exists) {
      await prisma.property.create({
        data: {
          userId: admin.id,
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip,
          dataJson: p.data,
        },
      });
    }
  }

  console.log('---------------------------------------------');
  console.log(`✅ Admin seeded: ${admin.email}`);
  console.log(`   Password:    ${password}`);
  console.log(`   Role:        ADMIN (only admin on this install)`);
  console.log(`   Sample data: 3 FL properties attached`);
  console.log('');
  console.log('   >>> Change this password immediately after first login. <<<');
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
