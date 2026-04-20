/**
 * Seed: 1 test user with branding, 3 sample listings.
 * Safe to re-run — uses upsert by email.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@realva.dev' },
    update: {},
    create: {
      email: 'test@realva.dev',
      plan: 'PRO',
      licenseNumber: 'BK-3000000',
      phone: '(305) 555-0100',
      website: 'https://example-realtor.com',
      brandColor: '#1d4ed8',
      footerDisclaimer:
        'Licensed Florida real estate professional. Information deemed reliable but not guaranteed.',
    },
  });

  const sample = [
    { address: '123 Ocean Dr', city: 'Miami Beach', state: 'FL', zip: '33139', data: { beds: 2, baths: 2, sqft: 1100, price: 825_000, year: 1998 } },
    { address: '45 Lake Breeze Ln', city: 'Naples', state: 'FL', zip: '34102', data: { beds: 4, baths: 3, sqft: 2650, price: 1_650_000, year: 2016 } },
    { address: '907 Riverside Ct', city: 'Jacksonville', state: 'FL', zip: '32207', data: { beds: 3, baths: 2, sqft: 1825, price: 415_000, year: 2005 } },
  ];

  for (const p of sample) {
    const existing = await prisma.property.findFirst({
      where: { userId: user.id, address: p.address },
    });
    if (!existing) {
      await prisma.property.create({
        data: { userId: user.id, address: p.address, city: p.city, state: p.state, zip: p.zip, dataJson: p.data },
      });
    }
  }

  console.log(`Seeded user ${user.email} with ${sample.length} sample properties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
