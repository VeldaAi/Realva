/**
 * One-shot admin creation using Better-Auth's OWN signup path, which
 * guarantees the stored password hash matches what the login endpoint
 * will validate against. Use when the manual seed's hash format breaks.
 *
 * Usage inside the container:
 *   docker compose exec app tsx scripts/create-admin.ts
 *
 * Reads ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD from env, falling back
 * to jason@velda.ai / password123!
 */
import { auth } from '../lib/auth';
import { prisma } from '../lib/db';

async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL || 'jason@velda.ai').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD || 'password123!';
  const name = 'Jason';

  // Wipe any prior record for this email so signUpEmail doesn't hit a unique
  // constraint. Safe — we're replacing the credential for a known admin.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.account.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log(`Removed existing user ${email}`);
  }

  // Create via Better-Auth's signup so the credential hash is exactly
  // what the login endpoint expects.
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
    asResponse: true,
  });

  if (!result.ok) {
    const body = await result.text().catch(() => '');
    throw new Error(`signUpEmail failed: HTTP ${result.status} ${body}`);
  }

  // Promote to ADMIN in our own User fields (Better-Auth's signup doesn't
  // know about our role column).
  await prisma.user.update({
    where: { email },
    data: {
      role: 'ADMIN',
      plan: 'PRO',
      brandColor: '#1d4ed8',
      website: 'https://velda.ai',
      footerDisclaimer:
        'Licensed Florida real estate professional. Information deemed reliable but not guaranteed.',
    },
  });

  // Sample properties so the dashboard isn't empty
  const admin = await prisma.user.findUniqueOrThrow({ where: { email } });
  const sample = [
    { address: '123 Ocean Dr', city: 'Miami Beach', state: 'FL', zip: '33139', data: { beds: 2, baths: 2, sqft: 1100, price: 825_000, year: 1998 } },
    { address: '45 Lake Breeze Ln', city: 'Naples', state: 'FL', zip: '34102', data: { beds: 4, baths: 3, sqft: 2650, price: 1_650_000, year: 2016 } },
    { address: '907 Riverside Ct', city: 'Jacksonville', state: 'FL', zip: '32207', data: { beds: 3, baths: 2, sqft: 1825, price: 415_000, year: 2005 } },
  ];
  for (const p of sample) {
    const exists = await prisma.property.findFirst({ where: { userId: admin.id, address: p.address } });
    if (!exists) {
      await prisma.property.create({
        data: { userId: admin.id, address: p.address, city: p.city, state: p.state, zip: p.zip, dataJson: p.data },
      });
    }
  }

  console.log('---------------------------------------------');
  console.log(`✅ Admin ready: ${email}`);
  console.log(`   Password:     ${password}`);
  console.log(`   Role:         ADMIN`);
  console.log(`   Sample data:  3 FL properties attached`);
  console.log('   >>> Log in at /login, then change password via /settings <<<');
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
