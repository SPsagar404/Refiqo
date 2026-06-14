/* eslint-disable no-console */
import {
  AvailabilityStatus,
  ContactMethod,
  JobStatus,
  PrismaClient,
  ReferralCategory,
  ResponseTime,
  UserRole,
  VerificationStatus,
  WorkMode,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const POPULAR_SKILLS = [
  'Java',
  'Spring Boot',
  'Microservices',
  'JavaScript',
  'TypeScript',
  'AWS',
  'MySQL',
  'PostgreSQL',
  'React.js',
  'Node.js',
  'Python',
  'Docker',
  'Kubernetes',
  'MongoDB',
  'GraphQL',
];

const OTHER_SKILLS = ['Go', 'Rust', 'Redis', 'Kafka', 'Terraform', 'Next.js', 'React Native'];

const COMPANIES = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Atlassian', domain: 'atlassian.com' },
];

const LOCATIONS = [
  { city: 'Bengaluru', country: 'India' },
  { city: 'Hyderabad', country: 'India' },
  { city: 'Pune', country: 'India' },
  { city: 'San Francisco', country: 'USA' },
  { city: 'London', country: 'UK' },
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  console.log('Seeding Refiqo…');

  // Skills
  const allSkills = [
    ...POPULAR_SKILLS.map((name) => ({ name, popular: true })),
    ...OTHER_SKILLS.map((name) => ({ name, popular: false })),
  ];
  for (const { name, popular } of allSkills) {
    await prisma.skill.upsert({
      where: { name },
      update: { isPopular: popular },
      create: { name, slug: slugify(name), isPopular: popular },
    });
  }

  // Companies + locations
  const companies = await Promise.all(
    COMPANIES.map((c) =>
      prisma.company.upsert({ where: { name: c.name }, update: {}, create: c }),
    ),
  );
  const locations = await Promise.all(
    LOCATIONS.map((l) =>
      prisma.location.upsert({
        where: { city_country: { city: l.city, country: l.country } },
        update: {},
        create: l,
      }),
    ),
  );

  // Super admin
  await prisma.adminUser.upsert({
    where: { email: 'admin@refiqo.com' },
    update: {},
    create: {
      email: 'admin@refiqo.com',
      name: 'Refiqo Admin',
      role: 'SUPER_ADMIN',
      passwordHash: await argon2.hash('Admin@12345'),
      permissions: ['*'],
    },
  });

  // Demo seeker
  const seekerPwd = await argon2.hash('Password@123');
  const javaSkill = await prisma.skill.findUnique({ where: { name: 'Java' } });
  const reactSkill = await prisma.skill.findUnique({ where: { name: 'React.js' } });

  const seeker = await prisma.user.upsert({
    where: { email: 'seeker@refiqo.com' },
    update: {},
    create: {
      email: 'seeker@refiqo.com',
      fullName: 'Aarav Sharma',
      passwordHash: seekerPwd,
      jobTitle: 'Backend Developer',
      experienceYears: 3,
      companyId: companies[3].id,
      locationId: locations[0].id,
      phone: '+91 90000 00000',
      about: 'Backend engineer looking for referrals at top product companies.',
      preferredWorkMode: WorkMode.HYBRID,
      isVerified: true,
      onboardingStep: 5,
      onboardingComplete: true,
      notificationPrefs: { create: {} },
      referralPreference: {
        create: {
          categories: [ReferralCategory.FULL_TIME, ReferralCategory.CONTRACT],
          roles: ['Backend Developer', 'Full Stack Developer'],
          preferredCompanies: ['Google', 'Stripe'],
          preferredLocations: ['Bengaluru', 'San Francisco'],
        },
      },
      availabilitySetting: {
        create: {
          availabilityStatus: AvailabilityStatus.AVAILABLE_NOW,
          responseTime: ResponseTime.WITHIN_24H,
          contactMethods: [ContactMethod.IN_APP_CHAT, ContactMethod.EMAIL],
        },
      },
    },
  });
  if (javaSkill) {
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: seeker.id, skillId: javaSkill.id } },
      update: {},
      create: { userId: seeker.id, skillId: javaSkill.id },
    });
  }

  // Demo referrers
  const referrerPwd = await argon2.hash('Password@123');
  const referrerSpecs = [
    { email: 'priya@refiqo.com', name: 'Priya Verma', title: 'Senior SDE', company: 0, loc: 3 },
    { email: 'rahul@refiqo.com', name: 'Rahul Nair', title: 'Engineering Manager', company: 3, loc: 0 },
  ];
  for (const spec of referrerSpecs) {
    const referrer = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        fullName: spec.name,
        passwordHash: referrerPwd,
        jobTitle: spec.title,
        experienceYears: 7,
        companyId: companies[spec.company].id,
        locationId: locations[spec.loc].id,
        role: UserRole.REFERRER,
        isVerified: true,
        companyVerified: true,
        onboardingComplete: true,
        onboardingStep: 5,
        notificationPrefs: { create: {} },
        referrerProfile: {
          create: {
            companyId: companies[spec.company].id,
            canRefer: true,
            verificationStatus: VerificationStatus.VERIFIED,
            referralsGiven: 24,
            responseRatePct: 92,
            avgResponseHours: 12,
            ratingAvg: 4.7,
            ratingCount: 18,
          },
        },
      },
    });
    if (reactSkill) {
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: referrer.id, skillId: reactSkill.id } },
        update: {},
        create: { userId: referrer.id, skillId: reactSkill.id },
      });
    }
  }

  // Demo referrers...
  // (already in the file)

  // Demo Jobs
  console.log('Seeding jobs…');
  await prisma.job.createMany({
    data: [
      {
        title: 'Senior Backend Engineer',
        companyId: companies[0].id,
        locationId: locations[0].id,
        workMode: WorkMode.REMOTE,
        description: 'Join Google to build the next generation of cloud infrastructure using Go and Java.',
        status: JobStatus.OPEN,
      },
      {
        title: 'Frontend Developer (React)',
        companyId: companies[1].id,
        locationId: locations[3].id,
        workMode: WorkMode.HYBRID,
        description: 'Help us reinvent e-commerce at Amazon. Experience with React and TypeScript required.',
        status: JobStatus.OPEN,
      },
      {
        title: 'Full Stack Engineer',
        companyId: companies[3].id,
        locationId: locations[0].id,
        workMode: WorkMode.ONSITE,
        description: 'Work on global payment systems at Stripe. Competitive salary and equity.',
        status: JobStatus.OPEN,
      },
    ],
  });

  // Platform settings...

  console.log('Seed complete.');
  console.log('  super-admin: admin@refiqo.com / Admin@12345');
  console.log('  seeker:      seeker@refiqo.com / Password@123');
  console.log('  referrers:   priya@refiqo.com, rahul@refiqo.com / Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
