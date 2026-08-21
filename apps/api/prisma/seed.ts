import { PrismaClient, UserRole, Difficulty } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Super Admin User (Rupesh Yadav) ────────────────────────────────────
  const superAdminPassword = await argon2.hash('admin123');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'rupesh.dev2002@gmail.com' },
    update: {
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      email: 'rupesh.dev2002@gmail.com',
      passwordHash: superAdminPassword,
      firstName: 'Rupesh',
      lastName: 'Yadav',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Super Admin user:', superAdmin.email);

  // ─── Platform Admin user ────────────────────────────────────────────────
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
  console.log('✅ Platform Admin user:', admin.email);

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
  const recruiterPassword = await argon2.hash('admin123');
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@acme.com' },
    update: {},
    create: {
      email: 'recruiter@acme.com',
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
      id: 'qb-node-0001',
      category: 'Node.js',
      technology: 'Node.js',
      question: 'Explain the Node.js event loop and how it handles asynchronous operations.',
      expectedAnswer: 'The event loop is a single-threaded mechanism that processes callbacks from the queue. It has phases: timers, pending callbacks, idle/prepare, poll, check, and close callbacks.',
      difficulty: Difficulty.MEDIUM,
      tags: ['event-loop', 'async', 'concurrency'],
    },
    {
      id: 'qb-node-0002',
      category: 'Node.js',
      technology: 'Node.js',
      question: 'What is the difference between process.nextTick() and setImmediate()?',
      expectedAnswer: 'process.nextTick() fires before the event loop continues to the next phase. setImmediate() fires in the check phase of the next iteration of the event loop.',
      difficulty: Difficulty.MEDIUM,
      tags: ['event-loop', 'timers'],
    },
    {
      id: 'qb-postgres-0001',
      category: 'PostgreSQL',
      technology: 'PostgreSQL',
      question: 'Explain the difference between B-tree and GIN indexes in PostgreSQL.',
      expectedAnswer: 'B-tree indexes are general-purpose and work well for equality and range queries on scalar values. GIN (Generalized Inverted Index) is better for composite values like arrays and JSONB, supporting containment operators.',
      difficulty: Difficulty.HARD,
      tags: ['indexes', 'performance'],
    },
    {
      id: 'qb-sys-0001',
      category: 'System Design',
      technology: 'System Design',
      question: 'Design a URL shortener service like bit.ly.',
      expectedAnswer: 'Should cover: hash generation, collision handling, storage (DB + cache), redirect mechanism, analytics, rate limiting, scale considerations.',
      difficulty: Difficulty.HARD,
      tags: ['system-design', 'scalability'],
    },
    {
      id: 'qb-react-0001',
      category: 'React',
      technology: 'React',
      question: 'Explain the difference between useMemo and useCallback hooks.',
      expectedAnswer: 'useMemo memoizes the result of a computation. useCallback memoizes a function reference. Both accept dependencies and only recompute when dependencies change.',
      difficulty: Difficulty.MEDIUM,
      tags: ['hooks', 'performance', 'memoization'],
    },
  ];

  for (const q of questions) {
    await prisma.questionBank.upsert({
      where: { id: q.id },
      update: {},
      create: { ...q, isActive: true },
    });
  }
  console.log('✅ Question bank seeded');

  // ─── Sample candidates ────────────────────────────────────────────────
  const candidate1 = await prisma.candidate.upsert({
    where: { id: 'cand-0001-00000000000000000001' },
    update: {},
    create: {
      id: 'cand-0001-00000000000000000001',
      companyId: company.id,
      createdById: recruiter.id,
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.connor@example.com',
      phone: '+1 555 0192',
      currentRole: 'Senior Backend Engineer',
      experienceYears: 6,
      skills: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'Redis'],
      status: 'INTERVIEWING',
    },
  });

  const candidate2 = await prisma.candidate.upsert({
    where: { id: 'cand-0002-00000000000000000002' },
    update: {},
    create: {
      id: 'cand-0002-00000000000000000002',
      companyId: company.id,
      createdById: recruiter.id,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 555 0148',
      currentRole: 'Full Stack Developer',
      experienceYears: 4,
      skills: ['React', 'Next.js', 'Node.js', 'TailwindCSS'],
      status: 'NEXT_ROUND',
    },
  });
  console.log('✅ Candidates seeded');

  // ─── Sample interview records with notes & feedback ───────────────────
  const interviewTypeBackend = await prisma.interviewType.findFirst({
    where: { name: 'Node.js Technical' },
  });

  if (interviewTypeBackend) {
    const now = new Date();
    const pastStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const pastEnd = new Date(pastStart.getTime() + 60 * 60 * 1000);

    const interview1 = await prisma.interview.upsert({
      where: { id: 'intv-0001-00000000000000000001' },
      update: {},
      create: {
        id: 'intv-0001-00000000000000000001',
        candidateId: candidate1.id,
        interviewerId: interviewer.id,
        companyId: company.id,
        interviewTypeId: interviewTypeBackend.id,
        scheduledStart: pastStart,
        scheduledEnd: pastEnd,
        timezone: 'Asia/Kolkata',
        status: 'COMPLETED',
        roundNumber: 1,
        notes: 'Candidate demonstrated great understanding of the Node.js event loop and asynchronous programming. Solved the concurrency problem in 20 minutes with clean TypeScript. Well-versed in PostgreSQL indexing and transactions.',
        createdById: recruiter.id,
      },
    });

    await prisma.interviewFeedback.upsert({
      where: { interviewId: interview1.id },
      update: {},
      create: {
        interviewId: interview1.id,
        interviewerId: interviewer.id,
        templateId: template.id,
        scores: {
          problem_solving: 5,
          coding_proficiency: 4,
          system_design: 4,
          communication: 5,
        },
        overallScore: 4.5,
        strengths: 'Strong analytical skills, fast coding speed, proactive communication, deep knowledge of async I/O.',
        weaknesses: 'Could optimize memory allocation in buffer streams slightly better.',
        recommendation: 'STRONG_HIRE',
        submittedAt: new Date(),
      },
    });

    // Upcoming round
    const futureStart = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);

    await prisma.interview.upsert({
      where: { id: 'intv-0002-00000000000000000002' },
      update: {},
      create: {
        id: 'intv-0002-00000000000000000002',
        candidateId: candidate2.id,
        interviewerId: interviewer.id,
        companyId: company.id,
        interviewTypeId: interviewTypeBackend.id,
        scheduledStart: futureStart,
        scheduledEnd: futureEnd,
        timezone: 'Asia/Kolkata',
        status: 'SCHEDULED',
        roundNumber: 2,
        notes: 'Focus on full-stack architecture, React state management, and API design.',
        createdById: recruiter.id,
      },
    });
    console.log('✅ Interviews and feedback scorecards seeded');
  }

  console.log('\n🎉 Seed complete!');
  console.log('\nDefault credentials:');
  console.log('  Super Admin: rupesh.dev2002@gmail.com / admin123');
  console.log('  Admin:       admin@intvwplt.com     / Admin@123456');
  console.log('  Co. Admin:   admin@acmecorp.com     / Company@123456');
  console.log('  Recruiter:   recruiter@acme.com     / admin123');
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
