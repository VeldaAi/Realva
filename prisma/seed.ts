/**
 * Seed:
 *   - One admin user (email from ADMIN_SEED_EMAIL, password ADMIN_SEED_PASSWORD)
 *   - One test user with full branding (test@realva.dev / realva1234)
 *   - 3 sample FL properties for the test user
 * Safe to re-run — upserts by email.
 */
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Better-Auth uses scrypt. This matches its stored format: {salt}:{hash}
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function seedUser(email: string, password: string, role: 'USER' | 'ADMIN', branding = false) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { role },
    create: {
      email,
      role,
      plan: 'PRO',
      ...(branding && {
        licenseNumber: 'BK-3000000',
        phone: '(305) 555-0100',
        website: 'https://example-realtor.com',
        brandColor: '#1d4ed8',
        footerDisclaimer: 'Licensed Florida real estate professional. Information deemed reliable but not guaranteed.',
      }),
    },
  });

  // Better-Auth stores credentials in the Account table
  const hash = hashPassword(password);
  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: user.id } },
    update: { password: hash },
    create: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hash,
    },
  });

  return user;
}

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@realva.dev';
  const adminPwd = process.env.ADMIN_SEED_PASSWORD || 'realva-admin-1234';
  const admin = await seedUser(adminEmail, adminPwd, 'ADMIN', true);
  const test = await seedUser('test@realva.dev', 'realva1234', 'USER', true);

  const sample = [
    { address: '123 Ocean Dr', city: 'Miami Beach', state: 'FL', zip: '33139', data: { beds: 2, baths: 2, sqft: 1100, price: 825_000, year: 1998 } },
    { address: '45 Lake Breeze Ln', city: 'Naples', state: 'FL', zip: '34102', data: { beds: 4, baths: 3, sqft: 2650, price: 1_650_000, year: 2016 } },
    { address: '907 Riverside Ct', city: 'Jacksonville', state: 'FL', zip: '32207', data: { beds: 3, baths: 2, sqft: 1825, price: 415_000, year: 2005 } },
  ];

  for (const p of sample) {
    const exists = await prisma.property.findFirst({ where: { userId: test.id, address: p.address } });
    if (!exists) {
      await prisma.property.create({
        data: { userId: test.id, address: p.address, city: p.city, state: p.state, zip: p.zip, dataJson: p.data },
      });
    }
  }

  console.log(`✅ Seeded admin ${admin.email} (password: ${adminPwd})`);
  console.log(`✅ Seeded test user test@realva.dev (password: realva1234), 3 properties`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
