export type BlogCategory =
  | 'Study Guide'
  | 'Exam Tips'
  | 'University Life'
  | 'Resource Guide';

export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  publishedAt: string;
  readTimeMinutes: number;
  author: string;
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-use-past-papers-effectively',
    title: 'How to Use Past Exam Papers Effectively',
    excerpt:
      'Past papers are one of the most powerful revision tools available to university students. Here is a step-by-step approach to using them properly.',
    category: 'Study Guide',
    publishedAt: '2026-06-15',
    readTimeMinutes: 7,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Past exam papers give you insight into how lecturers frame questions, which topics appear most often, and how marks are distributed. Many Zimbabwean students collect papers but never use them strategically. The difference between a pass and a distinction often comes down to how you practise with them.',
        ],
      },
      {
        heading: 'Step 1: Gather papers by subject and year',
        paragraphs: [
          'Organize past papers by subject, year, and semester. On eFundo, you can filter resources by institution, course, and subject so you always have the right papers for your module. Aim to collect at least three years of papers for each core subject.',
        ],
      },
      {
        heading: 'Step 2: Study before you attempt',
        paragraphs: [
          'Do not jump straight into timed practice. First, read through a paper while your notes are open. Identify which questions you can answer confidently and which topics need revision. Highlight recurring themes — if "normalization" appears in three consecutive Database Systems papers, that is a signal.',
        ],
      },
      {
        heading: 'Step 3: Simulate exam conditions',
        paragraphs: [
          'Once you have revised weak areas, attempt a full paper under timed conditions. No notes, no phone, no interruptions. Use the same time limit as the real exam. This builds stamina and reveals whether you can complete the paper in the allocated time.',
        ],
        list: [
          'Set a timer matching the official exam duration',
          'Use only permitted materials (calculator, formula sheet)',
          'Write answers in full, not bullet points',
          'Mark yourself honestly using memoranda when available',
        ],
      },
      {
        heading: 'Step 4: Review and fill gaps',
        paragraphs: [
          'After each attempt, spend equal time reviewing your answers. For every mark lost, write down why — was it a knowledge gap, misreading the question, or poor time management? Update your revision notes with these insights. Platforms like eFundo let you bookmark resources and track practice test scores so you can see improvement over time.',
        ],
      },
      {
        heading: 'Common mistakes to avoid',
        list: [
          'Memorizing answers without understanding concepts',
          'Only practising topics you already know well',
          'Skipping papers from older years (syllabus overlap is common)',
          'Ignoring the marking scheme and examiner comments',
        ],
      },
    ],
  },
  {
    slug: 'uz-exam-preparation-guide',
    title: 'University of Zimbabwe Exam Preparation Guide',
    excerpt:
      'A practical revision plan for UZ students covering timetable planning, resource gathering, and last-week strategies.',
    category: 'Study Guide',
    publishedAt: '2026-06-18',
    readTimeMinutes: 8,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Exam season at the University of Zimbabwe is intense. With multiple modules, limited library hours, and shared resources among classmates, preparation requires planning. This guide outlines a realistic approach used by successful UZ students across faculties.',
        ],
      },
      {
        heading: 'Six weeks before exams',
        paragraphs: [
          'Start by listing every module, its exam date, and the weighting of each assessment. Download your syllabus and past papers for each subject from eFundo or your faculty resource centre. Create a revision timetable that allocates more hours to weaker modules and those with earlier exam dates.',
        ],
      },
      {
        heading: 'Four weeks before exams',
        paragraphs: [
          'Move from passive reading to active recall. Close your notes and write everything you remember about a topic, then check what you missed. Form study groups with three to five focused classmates — teaching a concept to someone else is one of the best ways to solidify understanding.',
        ],
      },
      {
        heading: 'Two weeks before exams',
        paragraphs: [
          'Begin timed past-paper practice. For essay-based subjects like Law or Education, practise writing full introductions and conclusions within time limits. For quantitative subjects like Accounting or Engineering, drill problem types that appeared in recent papers.',
        ],
      },
      {
        heading: 'The final week',
        list: [
          'Review summary notes only — avoid learning entirely new topics',
          'Sleep at least seven hours per night',
          'Prepare exam materials: student ID, pens, calculator, ruler',
          'Visit the exam venue if you are unfamiliar with it',
          'Eat properly and stay hydrated',
        ],
      },
      {
        heading: 'On exam day',
        paragraphs: [
          'Arrive early. Read the entire paper before answering. Allocate time per question based on marks available. If stuck, move on and return later. UZ exams reward structured, complete answers over partially finished attempts at every question.',
        ],
      },
    ],
  },
  {
    slug: 'msu-study-tips-computer-science',
    title: 'MSU Computer Science Study Tips',
    excerpt:
      'Midlands State University CS students share proven strategies for programming modules, data structures, and software engineering exams.',
    category: 'Study Guide',
    publishedAt: '2026-06-20',
    readTimeMinutes: 6,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Computer Science at Midlands State University covers programming fundamentals, data structures, databases, software engineering, and more. The coursework is practical, but exams still test theory. Balancing coding practice with conceptual revision is the key.',
        ],
      },
      {
        heading: 'Programming modules (CS101, CS201)',
        paragraphs: [
          'Write code every day, even if only for thirty minutes. Do not just read solutions — type them out, break them, fix them. Use online judges and past lab exercises. Understand why a loop works, not just what it outputs.',
        ],
      },
      {
        heading: 'Data Structures and Algorithms',
        paragraphs: [
          'Draw structures by hand: linked lists, trees, graphs. Trace algorithms step by step on paper. Big-O analysis is a favourite exam topic — practise comparing time complexities of sorting and searching algorithms.',
        ],
        list: [
          'Implement each structure from scratch at least once',
          'Memorize traversal orders (pre/in/post-order)',
          'Practise recurrence relations for complexity',
        ],
      },
      {
        heading: 'Database Systems',
        paragraphs: [
          'ER diagrams, normalization (1NF through BCNF), and SQL queries appear regularly. Work through past paper questions on designing schemas and writing JOIN queries. Understand functional dependencies — examiners love asking you to identify them.',
        ],
      },
      {
        heading: 'Software Engineering',
        paragraphs: [
          'Know the SDLC phases, UML diagram types, and agile vs waterfall trade-offs. Past papers often include scenario questions asking you to identify requirements or design a simple system diagram. Practise drawing use case and class diagrams quickly.',
        ],
      },
    ],
  },
  {
    slug: 'building-a-revision-timetable',
    title: 'How to Build a Revision Timetable That Works',
    excerpt:
      'Stop cramming. Learn how to create a realistic revision schedule that covers all your modules without burning out.',
    category: 'Exam Tips',
    publishedAt: '2026-06-22',
    readTimeMinutes: 5,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'A revision timetable turns an overwhelming list of modules into manageable daily tasks. The best timetables are realistic, flexible, and balanced across subjects.',
        ],
      },
      {
        heading: 'Start with fixed commitments',
        paragraphs: [
          'Block out classes, work shifts, family obligations, and travel time first. What remains is your available study time. Be honest — scheduling ten hours of revision on a day you have lectures and a part-time job will not work.',
        ],
      },
      {
        heading: 'Prioritize by exam date and difficulty',
        paragraphs: [
          'Rank modules by exam date (soonest first) and by how confident you feel. Allocate more time to subjects where you are weakest. A common rule: spend 40% of time on weak modules, 40% on medium, and 20% maintaining strong ones.',
        ],
      },
      {
        heading: 'Use focused study blocks',
        list: [
          '45–50 minutes of focused study',
          '10–15 minute break',
          'After three blocks, take a longer 30-minute break',
          'Maximum 6–8 focused hours per day during peak revision',
        ],
      },
      {
        heading: 'Build in review days',
        paragraphs: [
          'Every seventh day, review everything you studied that week without learning new material. Spaced repetition — revisiting topics at increasing intervals — is proven to improve long-term retention. Tools like eFundo practice quizzes can automate this for subject-specific content.',
        ],
      },
    ],
  },
  {
    slug: 'first-year-university-survival-guide',
    title: 'Surviving First Year at Zimbabwean Universities',
    excerpt:
      'The transition from A-Level to university is challenging. Here is advice on academics, finances, and social life for first-year students.',
    category: 'University Life',
    publishedAt: '2026-06-25',
    readTimeMinutes: 7,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'First year is a shock for most students. You are suddenly responsible for your own schedule, finances, and learning. Lectures move faster, classes are larger, and nobody checks whether you attended. Success in year one sets the foundation for your entire degree.',
        ],
      },
      {
        heading: 'Academic habits',
        paragraphs: [
          'Attend lectures even when attendance is not compulsory. Sit near the front. Take notes by hand when possible — research shows it improves retention compared to typing. Review notes within 24 hours while the material is fresh.',
        ],
      },
      {
        heading: 'Managing freedom',
        paragraphs: [
          'Without teachers chasing you for assignments, procrastination becomes the biggest threat. Use a simple planner or phone calendar for every deadline. Start assignments at least one week before they are due. Join at least one study group in your core subjects.',
        ],
      },
      {
        heading: 'Financial tips',
        list: [
          'Budget monthly — track food, transport, and data costs',
          'Buy second-hand textbooks or use digital copies on eFundo',
          'Cook in groups to reduce food costs',
          'Look for on-campus work-study opportunities',
        ],
      },
      {
        heading: 'Health and wellbeing',
        paragraphs: [
          'Homesickness, stress, and burnout are normal. Stay connected with family but set boundaries so you can focus. Exercise regularly — even a twenty-minute walk helps. Most universities have counselling services; use them early, not as a last resort.',
        ],
      },
    ],
  },
  {
    slug: 'organizing-lecture-notes-digitally',
    title: 'How to Organize Your Lecture Notes Digitally',
    excerpt:
      'Paper notes get lost. Learn a simple digital system for storing, tagging, and searching your lecture notes across semesters.',
    category: 'Resource Guide',
    publishedAt: '2026-06-28',
    readTimeMinutes: 5,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'By second year, most students have stacks of notebooks they never open again. A digital note system saves space, makes searching easy, and lets you access materials from your phone during revision.',
        ],
      },
      {
        heading: 'Choose a consistent folder structure',
        paragraphs: [
          'Mirror your academic hierarchy: Institution → Year → Semester → Subject → Topic. Whether you use Google Drive, OneDrive, or a local folder, consistency matters more than the tool.',
        ],
        list: [
          'UZ / Year 2 / Semester 1 / Database Systems / Week 3 - Normalization',
          'Use PDF for scanned handwritten notes',
          'Name files with date and topic: 2026-03-15_ER-Diagrams.pdf',
        ],
      },
      {
        heading: 'Tag and cross-reference',
        paragraphs: [
          'When a concept appears in multiple subjects — statistics in Economics and Research Methods, for example — tag it in both folders or maintain a "key concepts" index document. This saves hours during exam revision.',
        ],
      },
      {
        heading: 'Back up everything',
        paragraphs: [
          'Use cloud sync plus a monthly backup to an external drive or second cloud account. Losing a semester of notes because of a stolen laptop or corrupted phone is preventable. eFundo also lets you download and bookmark lecture notes from your institution so you have a secondary copy.',
        ],
      },
    ],
  },
  {
    slug: 'nust-engineering-exam-tips',
    title: 'NUST Engineering Exam Tips',
    excerpt:
      'National University of Science and Technology engineering students: strategies for mathematics-heavy papers and practical assessments.',
    category: 'Study Guide',
    publishedAt: '2026-07-01',
    readTimeMinutes: 6,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Engineering programmes at NUST are rigorous. Mathematics, physics, and applied modules stack up quickly. These tips come from patterns seen across past papers and common challenges reported by NUST engineering students.',
        ],
      },
      {
        heading: 'Master the fundamentals',
        paragraphs: [
          'Calculus, linear algebra, and mechanics form the backbone of many engineering exams. Weaknesses in first-year maths propagate into later modules. If you are struggling, revisit foundational topics before moving to advanced material.',
        ],
      },
      {
        heading: 'Show your working',
        paragraphs: [
          'NUST engineering examiners award partial marks for correct methodology even when the final answer is wrong. Always write each step clearly. Label diagrams and units. A well-structured solution with a minor arithmetic error often scores higher than a correct answer with no working.',
        ],
      },
      {
        heading: 'Practise with past papers under time pressure',
        paragraphs: [
          'Engineering papers are often long. Practise completing full papers within the time limit. Identify which question types consume the most time and drill those specifically. eFundo hosts past papers organized by NUST faculty and year to speed up your search.',
        ],
      },
      {
        heading: 'Form technical study groups',
        paragraphs: [
          'Work through problem sets together. When one student explains a thermodynamics concept or circuit analysis approach, everyone benefits. Keep groups small and focused — social chat kills productivity.',
        ],
      },
    ],
  },
  {
    slug: 'active-recall-vs-rereading',
    title: 'Active Recall vs Re-Reading: What Actually Works',
    excerpt:
      'Re-reading your notes feels productive but science says otherwise. Learn why active recall beats passive review every time.',
    category: 'Exam Tips',
    publishedAt: '2026-07-02',
    readTimeMinutes: 5,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Most students revise by re-reading notes and highlighting textbooks. It feels like learning, but cognitive science research consistently shows that passive review is one of the least effective study methods. Active recall — testing yourself on material — produces dramatically better results.',
        ],
      },
      {
        heading: 'What is active recall?',
        paragraphs: [
          'Active recall means retrieving information from memory without looking at your notes. Examples include flashcards, practice questions, blank-page summaries, and explaining topics aloud. The struggle to remember strengthens neural pathways; re-reading does not.',
        ],
      },
      {
        heading: 'How to apply it',
        list: [
          'After each lecture, close your notes and write a summary from memory',
          'Use practice quizzes on eFundo for each subject',
          'Create question banks from your headings: turn "Types of Joins" into "List and explain five SQL join types"',
          'Study with a partner who asks random questions from the syllabus',
        ],
      },
      {
        heading: 'Combine with spaced repetition',
        paragraphs: [
          'Review the same material after one day, three days, one week, and two weeks. Each successful recall makes the memory more durable. Cramming the night before an exam can help short-term performance, but spaced active recall is what builds knowledge that lasts through finals and into your career.',
        ],
      },
    ],
  },
  {
    slug: 'cut-accounting-module-guide',
    title: 'CUT Accounting Module Study Guide',
    excerpt:
      'Chinhoyi University of Technology accounting students: how to approach financial accounting, taxation, and auditing modules.',
    category: 'Study Guide',
    publishedAt: '2026-07-03',
    readTimeMinutes: 6,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Accounting at Chinhoyi University of Technology requires precision, attention to detail, and strong numerical skills. Modules build on each other — weaknesses in introductory financial accounting will surface again in advanced reporting and auditing.',
        ],
      },
      {
        heading: 'Financial accounting',
        paragraphs: [
          'Master the double-entry framework until it is automatic. Practise journal entries, trial balances, and financial statement preparation from scratch. Past papers often present a scenario and ask you to produce a complete set of accounts. Speed comes from repetition.',
        ],
      },
      {
        heading: 'Taxation',
        paragraphs: [
          'Stay current with Zimbabwe tax legislation changes. Examiners expect you to know current rates and rules. Create summary tables for income tax, VAT, and capital allowances. Practise computing tax liability from scenario-based questions.',
        ],
      },
      {
        heading: 'Auditing',
        paragraphs: [
          'Understand audit planning, risk assessment, internal controls, and reporting standards. Scenario questions often ask you to identify audit risks or recommend procedures. Structure answers using professional audit terminology.',
        ],
      },
      {
        heading: 'Study resources',
        paragraphs: [
          'Use ICAZ study materials where relevant, CUT past papers, and lecture notes shared on eFundo. Form a calculation practice group — accounting is best learned by doing, not just reading.',
        ],
      },
    ],
  },
  {
    slug: 'exam-anxiety-management',
    title: 'Managing Exam Anxiety: Practical Techniques',
    excerpt:
      'Nervous before exams? These evidence-based techniques help you stay calm, focused, and perform at your best.',
    category: 'University Life',
    publishedAt: '2026-07-04',
    readTimeMinutes: 5,
    author: 'eFundo Team',
    sections: [
      {
        paragraphs: [
          'Exam anxiety affects most students at some point. A moderate level of stress can sharpen focus, but overwhelming anxiety impairs memory retrieval and decision-making. The good news: anxiety is manageable with preparation and technique.',
        ],
      },
      {
        heading: 'Before the exam',
        list: [
          'Prepare thoroughly — confidence comes from knowing you have done the work',
          'Visualize a calm exam experience: reading the paper, choosing questions, writing steadily',
          'Avoid caffeine overload on exam morning',
          'Arrive early to settle in; rushing increases panic',
        ],
      },
      {
        heading: 'During the exam',
        paragraphs: [
          'If panic hits, pause. Put down your pen, take four slow breaths (inhale four counts, hold four, exhale six). Read the easiest question first to build momentum. Remember: you do not need 100% to pass or even to get a good grade.',
        ],
      },
      {
        heading: 'After the exam',
        paragraphs: [
          'Do not dissect answers with classmates immediately — it fuels anxiety about questions you cannot change. Rest, eat, and shift focus to the next paper. One exam rarely defines your entire academic record.',
        ],
      },
      {
        heading: 'When to seek help',
        paragraphs: [
          'If anxiety is persistent, affects sleep for weeks, or prevents you from studying effectively, talk to your university counselling service or a healthcare professional. Seeking help is a sign of strength, not weakness.',
        ],
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getStudyGuides(): BlogPost[] {
  return getAllPosts().filter((p) => p.category === 'Study Guide');
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}
