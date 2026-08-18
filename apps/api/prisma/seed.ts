import { PrismaClient, UserRole, Difficulty } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin user ────────────────────────────────────────────────────────
  const adminPassword = await argon2.hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@intvwplt.com' },
    update: {},
    create: {
      email: 'admin@intvwplt.com',
      passwordHash: adminPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user:', admin.email);

  // ─── Demo company ──────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-id-0000-000000000001' },
    update: {},
    create: {
      id: 'demo-company-id-0000-000000000001',
      name: 'Acme Corp',
      email: 'hr@acmecorp.com',
      website: 'https://acmecorp.com',
      isActive: true,
    },
  });
  console.log('✅ Company:', company.name);

  // ─── Company admin ─────────────────────────────────────────────────────
  const companyAdminPassword = await argon2.hash('Company@123456');
  const companyAdmin = await prisma.user.upsert({
    where: { email: 'admin@acmecorp.com' },
    update: {},
    create: {
      email: 'admin@acmecorp.com',
      passwordHash: companyAdminPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.COMPANY_ADMIN,
      companyId: company.id,
      isActive: true,
    },
  });
  console.log('✅ Company admin:', companyAdmin.email);

  // ─── Recruiter ─────────────────────────────────────────────────────────
  const recruiterPassword = await argon2.hash('Recruiter@123456');
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@acmecorp.com' },
    update: {},
    create: {
      email: 'recruiter@acmecorp.com',
      passwordHash: recruiterPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: UserRole.RECRUITER,
      companyId: company.id,
      isActive: true,
    },
  });
  console.log('✅ Recruiter:', recruiter.email);

  // ─── Interviewer user + profile ────────────────────────────────────────
  const interviewerPassword = await argon2.hash('Interview@123456');
  const interviewerUser = await prisma.user.upsert({
    where: { email: 'interviewer@intvwplt.com' },
    update: {},
    create: {
      email: 'interviewer@intvwplt.com',
      passwordHash: interviewerPassword,
      firstName: 'Bob',
      lastName: 'Developer',
      role: UserRole.INTERVIEWER,
      isActive: true,
    },
  });

  const interviewer = await prisma.interviewer.upsert({
    where: { userId: interviewerUser.id },
    update: {},
    create: {
      userId: interviewerUser.id,
      bio: 'Senior Full Stack Engineer with 8 years of experience in Node.js, React, and PostgreSQL.',
      yearsOfExperience: 8,
      expertise: ['Full Stack', 'Backend', 'System Design'],
      technologies: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'AWS'],
      timezone: 'Asia/Kolkata',
      isAvailable: true,
    },
  });
  console.log('✅ Interviewer:', interviewerUser.email);

  // ─── Availability rules ────────────────────────────────────────────────
  const availabilityDays = [
    { dayOfWeek: 1, startTime: '10:00', endTime: '13:00' }, // Monday
    { dayOfWeek: 1, startTime: '15:00', endTime: '18:00' }, // Monday afternoon
    { dayOfWeek: 2, startTime: '10:00', endTime: '13:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '10:00', endTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '14:00', endTime: '18:00' }, // Thursday
    { dayOfWeek: 5, startTime: '10:00', endTime: '12:00' }, // Friday
  ];

  for (const day of availabilityDays) {
    await prisma.availabilityRule.upsert({
      where: {
        interviewerId_dayOfWeek_startTime_endTime: {
          interviewerId: interviewer.id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
        },
      },
      update: {},
      create: {
        interviewerId: interviewer.id,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        timezone: 'Asia/Kolkata',
        isActive: true,
      },
    });
  }
  console.log('✅ Availability rules created');

  // ─── Evaluation template ───────────────────────────────────────────────
  const template = await prisma.evaluationTemplate.upsert({
    where: { id: 'eval-template-backend-00000001' },
    update: {},
    create: {
      id: 'eval-template-backend-00000001',
      name: 'Backend Engineering Evaluation',
      description: 'Standard evaluation template for backend engineering interviews',
      criteria: {
        create: [
          { name: 'Technical Knowledge', description: 'Depth of technical knowledge', weight: 1.5, sortOrder: 1 },
          { name: 'Problem Solving', description: 'Ability to break down and solve problems', weight: 1.5, sortOrder: 2 },
          { name: 'Code Quality', description: 'Code structure, readability, and best practices', weight: 1.0, sortOrder: 3 },
          { name: 'Database Knowledge', description: 'SQL, schema design, query optimization', weight: 1.0, sortOrder: 4 },
          { name: 'API Design', description: 'REST API design principles', weight: 1.0, sortOrder: 5 },
          { name: 'System Design', description: 'Architecture and scalability thinking', weight: 1.0, sortOrder: 6 },
          { name: 'Communication', description: 'Clarity of explanation and communication', weight: 0.5, sortOrder: 7 },
        ],
      },
    },
  });
  console.log('✅ Evaluation template:', template.name);

  // ─── Interview types ───────────────────────────────────────────────────
  const interviewTypes = [
    { name: 'HR Screening', description: 'Initial HR screening call', durationMinutes: 30, difficulty: Difficulty.EASY },
    { name: 'Node.js Technical', description: 'Node.js backend technical interview', durationMinutes: 60, difficulty: Difficulty.MEDIUM, evaluationTemplateId: template.id },
    { name: 'React Frontend', description: 'React/Frontend technical interview', durationMinutes: 60, difficulty: Difficulty.MEDIUM },
    { name: 'System Design', description: 'System design and architecture discussion', durationMinutes: 90, difficulty: Difficulty.HARD, evaluationTemplateId: template.id },
    { name: 'Full Stack', description: 'Full stack technical interview', durationMinutes: 90, difficulty: Difficulty.HARD, evaluationTemplateId: template.id },
    { name: 'Java Backend', description: 'Java backend technical interview', durationMinutes: 60, difficulty: Difficulty.MEDIUM, evaluationTemplateId: template.id },
    { name: 'Machine Coding', description: '1-hour machine coding round', durationMinutes: 60, difficulty: Difficulty.HARD },
    { name: 'AWS/DevOps', description: 'Cloud infrastructure and DevOps interview', durationMinutes: 45, difficulty: Difficulty.MEDIUM },
  ];

  for (const type of interviewTypes) {
    await prisma.interviewType.upsert({
      where: { id: `type-${type.name.toLowerCase().replace(/[^a-z]/g, '-').slice(0, 30)}` },
      update: {},
      create: {
        id: `type-${type.name.toLowerCase().replace(/[^a-z]/g, '-').slice(0, 30)}`,
        ...type,
        isActive: true,
      },
    });
  }
  console.log('✅ Interview types created');

  // ─── Question bank samples ─────────────────────────────────────────────
  const questions = [
    {
      category: 'Node.js',
      technology: 'Node.js',
      question: 'Explain the Node.js event loop and how it handles asynchronous operations.',
      expectedAnswer: 'The event loop is a single-threaded mechanism that processes callbacks from the queue. It has phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks.',
      difficulty: Difficulty.MEDIUM,
      tags: ['event-loop', 'async', 'concurrency'],
    },
    {
      category: 'Node.js',
      technology: 'Node.js',
      question: 'What is the difference between process.nextTick() and setImmediate()?',
      expectedAnswer: 'process.nextTick() fires before the event loop continues to the next phase. setImmediate() fires in the check phase of the next iteration of the event loop.',
      difficulty: Difficulty.MEDIUM,
      tags: ['event-loop', 'timers'],
    },
    {
      category: 'PostgreSQL',
      technology: 'PostgreSQL',
      question: 'Explain the difference between B-tree and GIN indexes in PostgreSQL.',
      expectedAnswer: 'B-tree indexes are general-purpose and work well for equality and range queries on scalar values. GIN (Generalized Inverted Index) is better for composite values like arrays and JSONB, supporting containment operators.',
      difficulty: Difficulty.HARD,
      tags: ['indexes', 'performance'],
    },
    {
      category: 'System Design',
      technology: 'System Design',
      question: 'Design a URL shortener service like bit.ly.',
      expectedAnswer: 'Should cover: hash generation, collision handling, storage (DB + cache), redirect mechanism, analytics, rate limiting, scale considerations.',
      difficulty: Difficulty.HARD,
      tags: ['system-design', 'scalability'],
    },
    {
      category: 'React',
      technology: 'React',
      question: 'Explain the difference between useMemo and useCallback hooks.',
      expectedAnswer: 'useMemo memoizes the result of a computation. useCallback memoizes a function reference. Both accept dependencies and only recompute when dependencies change.',
      difficulty: Difficulty.MEDIUM,
      tags: ['hooks', 'performance', 'memoization'],
    },
  ];

  for (const q of questions) {
    await prisma.questionBank.create({ data: { ...q, isActive: true } }).catch(() => {
      // Ignore duplicate on re-seed
    });
  }
  console.log('✅ Question bank seeded');

  console.log('\n🎉 Seed complete!');
  console.log('\nDefault credentials:');
  console.log('  Admin:       admin@intvwplt.com     / Admin@123456');
  console.log('  Co. Admin:   admin@acmecorp.com     / Company@123456');
  console.log('  Recruiter:   recruiter@acmecorp.com / Recruiter@123456');
  console.log('  Interviewer: interviewer@intvwplt.com / Interview@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
