/* eslint-disable no-console */
import { PrismaClient, UserRole, VerificationStatus } from '@prisma/client';

/**
 * Promote one or more users to referrers by email.
 * Usage: npx ts-node scripts/make-referrer.ts a@x.com b@y.com
 */
const prisma = new PrismaClient();

async function main() {
  const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (emails.length === 0) {
    console.error('Provide at least one email. e.g. npx ts-node scripts/make-referrer.ts priya1@refiqo.com');
    process.exit(1);
  }

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`  skip — no user with email ${email}`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: UserRole.REFERRER } });
    await prisma.referrerProfile.upsert({
      where: { userId: user.id },
      update: { canRefer: true },
      create: {
        userId: user.id,
        companyId: user.companyId,
        canRefer: true,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
    console.log(`  ✓ ${user.fullName} (${email}) is now a REFERRER`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
