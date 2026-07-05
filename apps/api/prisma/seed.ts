import {
  PrismaClient,
  UserRole,
  ResourceType,
  ResourceStatus,
  LessonStatus,
  Difficulty,
  EducationLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const tertiaryUniversities = [
  { name: 'University of Zimbabwe', slug: 'uz' },
  { name: 'Midlands State University', slug: 'msu' },
  { name: 'National University of Science and Technology', slug: 'nust' },
  { name: 'Chinhoyi University of Technology', slug: 'cut' },
  { name: 'Great Zimbabwe University', slug: 'gzu' },
  { name: 'Mutare Teachers College', slug: 'mtc' },
];

const tertiarySubjects = [
  { name: 'Programming Fundamentals', code: 'CS101', year: 1, semester: 1 },
  { name: 'Data Structures', code: 'CS201', year: 2, semester: 1 },
  { name: 'Database Systems', code: 'CS301', year: 3, semester: 1 },
  { name: 'Software Engineering', code: 'CS401', year: 4, semester: 1 },
];

async function upsertProgram(data: {
  level: EducationLevel;
  name: string;
  slug: string;
  description?: string;
  providerName?: string;
  formOrGrade?: number;
  durationYears?: number;
  orderIndex?: number;
}) {
  return prisma.program.upsert({
    where: { level_slug: { level: data.level, slug: data.slug } },
    update: { name: data.name, providerName: data.providerName },
    create: data,
  });
}

async function upsertSubject(
  programId: string,
  subject: { name: string; code: string; year?: number; semester?: number },
) {
  return prisma.subject.upsert({
    where: { programId_code: { programId, code: subject.code } },
    update: {},
    create: { ...subject, programId },
  });
}

async function main() {
  console.log('Seeding eFundo database...');

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@efundo.co.zw' },
    update: {},
    create: {
      email: 'admin@efundo.co.zw',
      passwordHash,
      fullName: 'eFundo Admin',
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`Admin user: ${admin.email} (password: Admin123!)`);

  // Primary
  for (const grade of [5, 7]) {
    const program = await upsertProgram({
      level: EducationLevel.PRIMARY,
      name: `Grade ${grade}`,
      slug: `grade-${grade}`,
      formOrGrade: grade,
      orderIndex: grade,
    });
    for (const s of [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English', code: 'ENG' },
      { name: 'Science', code: 'SCI' },
    ]) {
      await upsertSubject(program.id, s);
    }
  }

  // O-Level
  const oLevel = await upsertProgram({
    level: EducationLevel.O_LEVEL,
    name: 'Form 4',
    slug: 'form-4',
    formOrGrade: 4,
  });
  for (const s of [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English Language', code: 'ENG' },
    { name: 'Combined Science', code: 'SCI' },
    { name: 'Geography', code: 'GEO' },
  ]) {
    await upsertSubject(oLevel.id, s);
  }

  // A-Level
  const aLevel = await upsertProgram({
    level: EducationLevel.A_LEVEL,
    name: 'Upper Six',
    slug: 'upper-six',
    formOrGrade: 6,
  });
  for (const s of [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
  ]) {
    await upsertSubject(aLevel.id, s);
  }

  // Tertiary — universities
  let uzProgramId: string | null = null;
  let cs301SubjectId: string | null = null;

  for (const uni of tertiaryUniversities) {
    const program = await upsertProgram({
      level: EducationLevel.TERTIARY,
      name: 'BSc Computer Science',
      slug: `${uni.slug}-bsc-computer-science`,
      providerName: uni.name,
      durationYears: 4,
    });
    if (uni.slug === 'uz') uzProgramId = program.id;

    for (const subject of tertiarySubjects) {
      const s = await upsertSubject(program.id, subject);
      if (uni.slug === 'uz' && subject.code === 'CS301') cs301SubjectId = s.id;
    }
    console.log(`Seeded tertiary: ${uni.name}`);
  }

  // Other
  const other = await upsertProgram({
    level: EducationLevel.OTHER,
    name: 'Professional Development',
    slug: 'professional-development',
    description: 'Short courses, certifications, and self-paced learning',
  });
  await upsertSubject(other.id, { name: 'Digital Literacy', code: 'DIG101' });

  // Library samples for UZ tertiary
  if (uzProgramId && cs301SubjectId) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'uz', 'samples');
    fs.mkdirSync(uploadDir, { recursive: true });

    const samples = [
      {
        title: 'CS301 Database Systems — 2024 Exam Paper',
        slug: 'cs301-database-systems-2024-exam',
        type: ResourceType.PAST_PAPER,
        year: 2024,
        semester: 1,
        fileName: 'CS301-2024-Exam.txt',
        content:
          'CS301 Database Systems — November 2024 Final Examination\n\nSection A: Multiple Choice (20 marks)\n...\n',
      },
      {
        title: 'CS301 Normalization Lecture Notes',
        slug: 'cs301-normalization-notes',
        type: ResourceType.LECTURE_NOTE,
        year: 2024,
        semester: 1,
        fileName: 'CS301-Normalization-Notes.txt',
        content:
          'Database Normalization — Lecture Notes\n\n1NF, 2NF, 3NF, BCNF explained with examples.\n',
      },
      {
        title: 'CS201 Data Structures — 2023 Exam Paper',
        slug: 'cs201-data-structures-2023-exam',
        type: ResourceType.PAST_PAPER,
        year: 2023,
        semester: 1,
        fileName: 'CS201-2023-Exam.txt',
        content:
          'CS201 Data Structures — June 2023 Examination\n\nQuestion 1: Linked Lists (25 marks)\n...',
      },
    ];

    for (const sample of samples) {
      const fileKey = `uz/samples/${sample.fileName}`;
      const filePath = path.join(process.cwd(), 'uploads', fileKey);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, sample.content);

      await prisma.resource.upsert({
        where: { programId_slug: { programId: uzProgramId, slug: sample.slug } },
        update: {},
        create: {
          title: sample.title,
          slug: sample.slug,
          description: `Sample ${sample.type.replace('_', ' ').toLowerCase()} for University of Zimbabwe students.`,
          type: sample.type,
          status: ResourceStatus.PUBLISHED,
          educationLevel: EducationLevel.TERTIARY,
          programId: uzProgramId,
          subjectId: cs301SubjectId,
          year: sample.year,
          semester: sample.semester,
          author: 'eFundo Team',
          uploaderId: admin.id,
          fileKey,
          fileName: sample.fileName,
          fileSize: Buffer.byteLength(sample.content),
          mimeType: 'text/plain',
          tags: ['sample', 'computer-science'],
          publishedAt: new Date(),
        },
      });
    }
    console.log('Seeded sample library resources for UZ tertiary');

    // LMS for CS301
    const module = await prisma.module.upsert({
      where: { subjectId_slug: { subjectId: cs301SubjectId, slug: 'relational-design' } },
      update: {},
      create: {
        subjectId: cs301SubjectId,
        title: 'Relational Database Design',
        slug: 'relational-design',
        description:
          'Core concepts of relational databases, ER modelling, and normalization.',
        orderIndex: 0,
      },
    });

    const introTopic = await prisma.topic.upsert({
      where: { moduleId_slug: { moduleId: module.id, slug: 'introduction' } },
      update: {},
      create: {
        moduleId: module.id,
        title: 'Introduction to Databases',
        slug: 'introduction',
        description: 'What databases are and why they matter.',
        orderIndex: 0,
      },
    });

    const normTopic = await prisma.topic.upsert({
      where: { moduleId_slug: { moduleId: module.id, slug: 'normalization' } },
      update: {},
      create: {
        moduleId: module.id,
        title: 'Normalization',
        slug: 'normalization',
        description: 'Eliminating redundancy through normal forms.',
        orderIndex: 1,
      },
    });

    await prisma.lesson.upsert({
      where: { topicId_slug: { topicId: introTopic.id, slug: 'what-is-a-database' } },
      update: {
        videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        content: [
          { type: 'heading', text: 'What is a Database?' },
          {
            type: 'paragraph',
            text: 'A database is an organised collection of structured data, typically stored electronically and managed by a DBMS.',
          },
          {
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
            caption: 'Introduction to databases (sample lecture)',
          },
        ],
      },
      create: {
        topicId: introTopic.id,
        title: 'What is a Database?',
        slug: 'what-is-a-database',
        summary: 'Foundational concepts of databases and the relational model.',
        content: [
          { type: 'heading', text: 'What is a Database?' },
          {
            type: 'paragraph',
            text: 'A database is an organised collection of structured data, typically stored electronically and managed by a DBMS.',
          },
          {
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
            caption: 'Introduction to databases (sample lecture)',
          },
        ],
        videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        durationMinutes: 12,
        difficulty: Difficulty.BEGINNER,
        objectives: ['Define a database and DBMS'],
        status: LessonStatus.PUBLISHED,
        orderIndex: 0,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });

    await prisma.lesson.upsert({
      where: { topicId_slug: { topicId: normTopic.id, slug: 'normal-forms' } },
      update: {},
      create: {
        topicId: normTopic.id,
        title: 'Normal Forms (1NF to BCNF)',
        slug: 'normal-forms',
        summary: 'A practical guide to database normalization.',
        content: [
          { type: 'heading', text: 'Why Normalize?' },
          {
            type: 'paragraph',
            text: 'Normalization reduces redundancy and improves data integrity.',
          },
        ],
        durationMinutes: 20,
        difficulty: Difficulty.INTERMEDIATE,
        objectives: ['Apply 1NF, 2NF, and 3NF'],
        prerequisites: ['What is a Database?'],
        status: LessonStatus.PUBLISHED,
        orderIndex: 0,
        authorId: admin.id,
        publishedAt: new Date(),
      },
    });

    await prisma.discussion.upsert({
      where: { id: 'seed-cs301-discussion-1' },
      update: {},
      create: {
        id: 'seed-cs301-discussion-1',
        subjectId: cs301SubjectId,
        authorId: admin.id,
        title: 'How do I study for the CS301 normalization exam?',
        body: 'The November paper always has a normalization question. What approach do you use?',
        isPinned: true,
      },
    });
    console.log('Seeded LMS lessons and forum for CS301');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
