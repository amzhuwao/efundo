import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  QuestionStatus,
  QuizStatus,
  AttemptStatus,
  QuestionType,
  QuizType,
  UserRole,
  Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateQuizDto,
  UpdateQuizDto,
  SubmitAttemptDto,
} from './dto/assessment.dto';

type McqOption = { id: string; text: string };
type CorrectAnswer = {
  type: 'single' | 'boolean' | 'text' | 'essay';
  value?: string | boolean;
  values?: string[];
  caseSensitive?: boolean;
  rubric?: string;
  sampleAnswer?: string;
  maxPoints?: number;
};

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  private authorRoles: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.INSTITUTION_ADMIN,
    UserRole.LECTURER,
  ];

  private assertAuthor(role: UserRole) {
    if (!this.authorRoles.includes(role)) {
      throw new ForbiddenException('Only lecturers and admins can manage assessments');
    }
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private stripQuestionForStudent(q: {
    id: string;
    type: QuestionType;
    stem: string;
    options: unknown;
    difficulty: string;
    tags: string[];
  }) {
    return {
      id: q.id,
      type: q.type,
      stem: q.stem,
      options: q.options,
      difficulty: q.difficulty,
      tags: q.tags,
    };
  }

  private gradeAnswer(
    type: QuestionType,
    correct: CorrectAnswer,
    answer: string | boolean,
  ): boolean | null {
    if (type === QuestionType.ESSAY) return null;
    if (type === QuestionType.TRUE_FALSE) {
      return correct.type === 'boolean' && answer === correct.value;
    }
    if (type === QuestionType.MULTIPLE_CHOICE) {
      return (
        correct.type === 'single' &&
        String(answer).toLowerCase() === String(correct.value).toLowerCase()
      );
    }
    const text = String(answer).trim();
    const accepted = correct.values ?? (correct.value != null ? [String(correct.value)] : []);
    const caseSensitive = correct.caseSensitive ?? false;
    return accepted.some((v) =>
      caseSensitive ? text === v : text.toLowerCase() === v.toLowerCase(),
    );
  }

  private certificateCode() {
    return `EF-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private async issueCertificateIfEligible(
    userId: string,
    attemptId: string,
    quiz: { id: string; type: QuizType },
    score: number,
    passed: boolean,
    hasPendingEssays: boolean,
  ) {
    if (
      !passed ||
      quiz.type !== QuizType.MOCK_EXAM ||
      hasPendingEssays ||
      score == null
    ) {
      return null;
    }

    const existing = await this.prisma.quizCertificate.findUnique({
      where: { attemptId },
    });
    if (existing) return existing;

    return this.prisma.quizCertificate.create({
      data: {
        userId,
        attemptId,
        quizId: quiz.id,
        code: this.certificateCode(),
        score,
      },
    });
  }

  // ── Questions (admin/lecturer) ──────────────────────────────────────────

  listQuestions(subjectId?: string, status?: QuestionStatus) {
    return this.prisma.question.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuestion(dto: CreateQuestionDto, userId: string) {
    return this.prisma.question.create({
      data: {
        ...dto,
        options: dto.options as Prisma.InputJsonValue,
        correctAnswer: dto.correctAnswer as Prisma.InputJsonValue,
        authorId: userId,
        status: QuestionStatus.DRAFT,
      },
    });
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto, role: UserRole) {
    this.assertAuthor(role);
    const existing = await this.prisma.question.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Question not found');

    const data: Prisma.QuestionUpdateInput = {};
    if (dto.topicId !== undefined) data.topic = { connect: { id: dto.topicId } };
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.stem !== undefined) data.stem = dto.stem;
    if (dto.explanation !== undefined) data.explanation = dto.explanation;
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.options !== undefined) data.options = dto.options as Prisma.InputJsonValue;
    if (dto.correctAnswer !== undefined) {
      data.correctAnswer = dto.correctAnswer as Prisma.InputJsonValue;
    }

    return this.prisma.question.update({ where: { id }, data });
  }

  async publishQuestion(id: string, role: UserRole) {
    this.assertAuthor(role);
    return this.prisma.question.update({
      where: { id },
      data: { status: QuestionStatus.PUBLISHED },
    });
  }

  async unpublishQuestion(id: string, role: UserRole) {
    this.assertAuthor(role);
    return this.prisma.question.update({
      where: { id },
      data: { status: QuestionStatus.DRAFT },
    });
  }

  async deleteQuestion(id: string, role: UserRole) {
    this.assertAuthor(role);
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }

  // ── Quizzes ───────────────────────────────────────────────────────────────

  listQuizzes(subjectId?: string, publishedOnly = true) {
    return this.prisma.quiz.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(publishedOnly ? { status: QuizStatus.PUBLISHED } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: [{ type: 'asc' }, { title: 'asc' }],
    });
  }

  async getQuiz(id: string, includeAnswers = false) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        questions: {
          include: { question: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (includeAnswers) return quiz;

    return {
      ...quiz,
      questions: quiz.questions.map((qq) => ({
        orderIndex: qq.orderIndex,
        question: this.stripQuestionForStudent(qq.question),
      })),
    };
  }

  async createQuiz(dto: CreateQuizDto, userId: string, role: UserRole) {
    this.assertAuthor(role);
    const { questionIds, ...data } = dto;

    const quiz = await this.prisma.quiz.create({
      data: {
        ...data,
        authorId: userId,
        status: QuizStatus.DRAFT,
      },
    });

    if (questionIds?.length) {
      await this.prisma.quizQuestion.createMany({
        data: questionIds.map((questionId, i) => ({
          quizId: quiz.id,
          questionId,
          orderIndex: i,
        })),
      });
    }

    return this.getQuiz(quiz.id, true);
  }

  async updateQuiz(id: string, dto: UpdateQuizDto, role: UserRole) {
    this.assertAuthor(role);
    const { questionIds, ...data } = dto;

    await this.prisma.quiz.update({ where: { id }, data });

    if (questionIds) {
      await this.prisma.quizQuestion.deleteMany({ where: { quizId: id } });
      if (questionIds.length) {
        await this.prisma.quizQuestion.createMany({
          data: questionIds.map((questionId, i) => ({
            quizId: id,
            questionId,
            orderIndex: i,
          })),
        });
      }
    }

    return this.getQuiz(id, true);
  }

  async publishQuiz(id: string, role: UserRole) {
    this.assertAuthor(role);
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz._count.questions < 1) {
      throw new BadRequestException('Add at least one question before publishing');
    }

    return this.prisma.quiz.update({
      where: { id },
      data: { status: QuizStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async unpublishQuiz(id: string, role: UserRole) {
    this.assertAuthor(role);
    return this.prisma.quiz.update({
      where: { id },
      data: { status: QuizStatus.DRAFT, publishedAt: null },
    });
  }

  async deleteQuiz(id: string, role: UserRole) {
    this.assertAuthor(role);
    const attempts = await this.prisma.quizAttempt.count({ where: { quizId: id } });
    if (attempts > 0) {
      throw new BadRequestException(
        'Cannot delete a quiz with student attempts. Unpublish it instead.',
      );
    }
    await this.prisma.quiz.delete({ where: { id } });
    return { ok: true };
  }

  // ── Attempts ──────────────────────────────────────────────────────────────

  async startAttempt(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId, status: QuizStatus.PUBLISHED },
      include: {
        questions: { include: { question: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    let pool = quiz.questions.map((qq) => qq.question).filter(
      (q) => q.status === QuestionStatus.PUBLISHED,
    );

    if (pool.length === 0) {
      pool = await this.prisma.question.findMany({
        where: { subjectId: quiz.subjectId, status: QuestionStatus.PUBLISHED },
      });
    }

    if (pool.length === 0) {
      throw new BadRequestException('No published questions available for this quiz');
    }

    let selected = pool;
    if (quiz.questions.length > 0) {
      selected = pool.slice(0, quiz.questionCount);
    } else {
      selected = this.shuffle(pool).slice(0, Math.min(quiz.questionCount, pool.length));
    }

    if (quiz.shuffleQuestions) {
      selected = this.shuffle(selected);
    }

    const questionOrder = selected.map((q) => q.id);
    const expiresAt = quiz.timeLimitMinutes
      ? new Date(Date.now() + quiz.timeLimitMinutes * 60 * 1000)
      : null;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        totalCount: selected.length,
        questionOrder,
        expiresAt,
      },
    });

    const questions = selected.map((q) => {
      const base = this.stripQuestionForStudent(q);
      if (
        quiz.shuffleOptions &&
        q.type === QuestionType.MULTIPLE_CHOICE &&
        Array.isArray(q.options)
      ) {
        return {
          ...base,
          options: this.shuffle(q.options as McqOption[]),
        };
      }
      return base;
    });

    return {
      attemptId: attempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        type: quiz.type,
        timeLimitMinutes: quiz.timeLimitMinutes,
        allowBacktrack: quiz.allowBacktrack,
        passingScore: quiz.passingScore,
      },
      expiresAt,
      questions,
    };
  }

  async submitAttempt(attemptId: string, userId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true,
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt already submitted');
    }
    if (attempt.expiresAt && attempt.expiresAt < new Date()) {
      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.EXPIRED },
      });
      throw new BadRequestException('Time limit exceeded');
    }

    const questions = await this.prisma.question.findMany({
      where: { id: { in: attempt.questionOrder } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const answerMap = new Map(dto.answers.map((a) => [a.questionId, a.answer]));
    const orderedQuestions = attempt.questionOrder
      .map((id) => questionMap.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q);

    let correctCount = 0;
    const gradedAnswers: Array<Record<string, unknown>> = [];

    for (const question of orderedQuestions) {
      const answer = answerMap.get(question.id);

      if (question.type === QuestionType.ESSAY) {
        gradedAnswers.push({
          questionId: question.id,
          answer: answer ?? '',
          isCorrect: null,
          pendingReview: true,
          rubric: (question.correctAnswer as CorrectAnswer).rubric,
        });
        continue;
      }

      const isCorrect =
        answer != null &&
        this.gradeAnswer(
          question.type,
          question.correctAnswer as CorrectAnswer,
          answer,
        ) === true;
      if (isCorrect) correctCount++;
      gradedAnswers.push({
        questionId: question.id,
        answer: answer ?? '',
        isCorrect,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
      });
    }

    const gradableCount = orderedQuestions.filter(
      (q) => q.type !== QuestionType.ESSAY,
    ).length;
    const hasPendingEssays = gradedAnswers.some((a) => a.isCorrect === null);
    const score =
      gradableCount > 0 ? Math.round((correctCount / gradableCount) * 100) : null;
    const passed =
      score != null && score >= attempt.quiz.passingScore && !hasPendingEssays;

    const updated = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        correctCount,
        score,
        answers: gradedAnswers as Prisma.InputJsonValue,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            passingScore: true,
            subject: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    const certificate = await this.issueCertificateIfEligible(
      userId,
      attemptId,
      updated.quiz,
      score ?? 0,
      passed,
      hasPendingEssays,
    );

    return {
      ...updated,
      passed,
      hasPendingEssays,
      certificate: certificate
        ? { id: certificate.id, code: certificate.code, issuedAt: certificate.issuedAt }
        : null,
    };
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            passingScore: true,
            subject: { select: { id: true, code: true, name: true } },
          },
        },
        certificate: {
          select: { id: true, code: true, issuedAt: true, score: true },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException();
    const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
    const hasPendingEssays = answers.some(
      (a) => typeof a === 'object' && a != null && (a as { isCorrect?: boolean | null }).isCorrect === null,
    );
    const passed =
      attempt.score != null &&
      attempt.score >= attempt.quiz.passingScore &&
      !hasPendingEssays;
    return {
      ...attempt,
      passed,
      hasPendingEssays,
    };
  }

  listMyCertificates(userId: string) {
    return this.prisma.quizCertificate.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: { select: { id: true, code: true, name: true } },
          },
        },
        attempt: { select: { id: true, submittedAt: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getCertificate(certificateId: string, userId: string) {
    const cert = await this.prisma.quizCertificate.findUnique({
      where: { id: certificateId },
      include: {
        user: { select: { fullName: true, email: true } },
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: { select: { id: true, code: true, name: true } },
          },
        },
        attempt: { select: { id: true, submittedAt: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    if (cert.userId !== userId) throw new ForbiddenException();
    return cert;
  }

  listMyAttempts(userId: string, limit = 20) {
    return this.prisma.quizAttempt.findMany({
      where: { userId, status: AttemptStatus.SUBMITTED },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            type: true,
            subject: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    });
  }

  async getMyStats(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, status: AttemptStatus.SUBMITTED },
      include: {
        quiz: {
          select: {
            subjectId: true,
            passingScore: true,
            subject: { select: { code: true, name: true } },
          },
        },
      },
    });

    const totalAttempts = attempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts)
        : 0;
    const passed = attempts.filter(
      (a) => a.score != null && a.score >= a.quiz.passingScore,
    ).length;

    const bySubject = new Map<
      string,
      { subjectCode: string; subjectName: string; attempts: number; avgScore: number; scores: number[] }
    >();
    for (const a of attempts) {
      const sid = a.quiz.subjectId;
      const entry = bySubject.get(sid) ?? {
        subjectCode: a.quiz.subject.code,
        subjectName: a.quiz.subject.name,
        attempts: 0,
        avgScore: 0,
        scores: [],
      };
      entry.attempts++;
      entry.scores.push(a.score ?? 0);
      bySubject.set(sid, entry);
    }

    const subjectStats = [...bySubject.values()].map((s) => ({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      attempts: s.attempts,
      avgScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
    }));

    const weakAreas = subjectStats
      .filter((s) => s.avgScore < 60 && s.attempts >= 1)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);

    const certificates = await this.prisma.quizCertificate.count({
      where: { userId },
    });

    return {
      totalAttempts,
      avgScore,
      passed,
      certificates,
      recentAttempts: attempts.slice(0, 5),
      subjectStats,
      weakAreas,
    };
  }
}
