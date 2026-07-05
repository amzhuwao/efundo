/**
 * Imports Harvard PLL free course *listings* (metadata + links only).
 * Does NOT download or republish course videos, syllabi, or other copyrighted materials.
 *
 * Usage: npm run import:harvard --workspace=@efundo/api
 */

import { PrismaClient, ResourceType, ResourceStatus, EducationLevel } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_NAME = 'Harvard University';
const SOURCE_CATALOG_URL = 'https://pll.harvard.edu/catalog/free';
const ATTRIBUTION_NOTICE =
  'This is a catalog listing only. Course content is owned by Harvard University and offered via Harvard Professional & Lifelong Learning (pll.harvard.edu). eFundo does not host Harvard course materials. Enroll and study on Harvard\'s official platform.';

const PROGRAM_SLUG = 'harvard-free-courses';

const CATEGORY_CODES: Record<string, string> = {
  'Art & Design': 'ART',
  Business: 'BUS',
  'Computer Science': 'CS',
  'Data Science': 'DS',
  'Education & Teaching': 'EDU',
  'Health & Medicine': 'HLTH',
  Humanities: 'HUM',
  Theology: 'THEO',
  Mathematics: 'MATH',
  Programming: 'PROG',
  Science: 'SCI',
  'Social Sciences': 'SOC',
};

interface ParsedCourse {
  title: string;
  url: string;
  category: string;
  durationWeeks?: number;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugFromUrl(url: string) {
  const match = url.match(/\/course\/([^/?#]+)/);
  return (match?.[1] ?? 'course').slice(0, 80);
}

function subjectCode(category: string) {
  return (
    CATEGORY_CODES[category] ??
    category.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 12)
  );
}

function parseCoursesFromHtml(html: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(/data-course-name\s*=\s*"([^"]+)"/g)) {
    const index = match.index ?? 0;
    const chunk = html.slice(Math.max(0, index - 2000), index + match[0].length + 500);

    const title = decodeHtmlEntities(match[1]);
    const lengthMatch = chunk.match(/data-course-length\s*=\s*"(\d+)weeks"/i);
    const categoryMatch = chunk.match(/data-item-category\s*=\s*"([^"]+)"/);
    const hrefMatches = [...chunk.matchAll(/href="(\/course\/[^"]+)"/g)];
    const relPath = hrefMatches.at(-1)?.[1];
    if (!relPath) continue;

    const url = `https://pll.harvard.edu${relPath}`;
    if (seen.has(url)) continue;
    seen.add(url);

    courses.push({
      title,
      url,
      category: categoryMatch?.[1] ?? 'Other',
      durationWeeks: lengthMatch ? Number(lengthMatch[1]) : undefined,
    });
  }

  return courses;
}

async function fetchCatalogPage(page: number) {
  const url = page === 0 ? SOURCE_CATALOG_URL : `${SOURCE_CATALOG_URL}?page=${page}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'eFundo-CatalogImporter/1.0 (educational link directory)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function buildDescription(course: ParsedCourse) {
  const duration = course.durationWeeks ? `${course.durationWeeks}-week ` : '';
  return (
    `Free ${duration}online course from Harvard University (${course.category}): "${course.title}". ` +
    `eFundo provides this directory listing for discovery only. All materials are hosted on Harvard's website — use the external link to enroll.`
  );
}

async function main() {
  console.log('Fetching Harvard PLL free course catalog…');

  const allCourses = new Map<string, ParsedCourse>();

  for (let page = 0; page < 10; page++) {
    const html = await fetchCatalogPage(page);
    const parsed = parseCoursesFromHtml(html);
    console.log(`Page ${page}: ${parsed.length} courses`);
    if (parsed.length === 0) break;
    for (const course of parsed) {
      allCourses.set(course.url, course);
    }
  }

  console.log(`Total unique courses: ${allCourses.size}`);

  if (allCourses.size === 0) {
    console.error('No courses parsed. Aborting.');
    process.exit(1);
  }

  const program = await prisma.program.upsert({
    where: { level_slug: { level: EducationLevel.OTHER, slug: PROGRAM_SLUG } },
    update: {
      name: 'Harvard Free Courses',
      providerName: SOURCE_NAME,
      description:
        'Directory of free online courses from Harvard Professional & Lifelong Learning. eFundo provides links and attribution only; all course content is hosted by Harvard.',
    },
    create: {
      level: EducationLevel.OTHER,
      name: 'Harvard Free Courses',
      slug: PROGRAM_SLUG,
      providerName: SOURCE_NAME,
      description:
        'Directory of free online courses from Harvard Professional & Lifelong Learning. eFundo provides links and attribution only; all course content is hosted by Harvard.',
      orderIndex: 0,
    },
  });

  const subjectIds = new Map<string, string>();

  for (const course of allCourses.values()) {
    const code = subjectCode(course.category);
    if (!subjectIds.has(code)) {
      const subject = await prisma.subject.upsert({
        where: { programId_code: { programId: program.id, code } },
        update: { name: course.category },
        create: {
          programId: program.id,
          code,
          name: course.category,
        },
      });
      subjectIds.set(code, subject.id);
    }
  }

  let created = 0;
  let updated = 0;

  for (const course of allCourses.values()) {
    const code = subjectCode(course.category);
    const subjectId = subjectIds.get(code)!;
    const slug = `harvard-${slugFromUrl(course.url)}`.slice(0, 80);

    const data = {
      title: course.title,
      description: buildDescription(course),
      type: ResourceType.EXTERNAL_COURSE,
      status: ResourceStatus.PUBLISHED,
      educationLevel: EducationLevel.OTHER,
      programId: program.id,
      subjectId,
      author: SOURCE_NAME,
      externalUrl: course.url,
      sourceName: SOURCE_NAME,
      sourceCatalogUrl: SOURCE_CATALOG_URL,
      attributionNotice: ATTRIBUTION_NOTICE,
      durationWeeks: course.durationWeeks ?? null,
      tags: [
        'harvard',
        'free-course',
        'external',
        course.category.toLowerCase().replace(/\s+/g, '-'),
      ],
      publishedAt: new Date(),
    };

    const existing = await prisma.resource.findFirst({
      where: { programId: program.id, slug },
    });

    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.resource.create({ data: { slug, ...data } });
      created++;
    }
  }

  console.log(`Import complete. Created: ${created}, updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
