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
  UserRole,
  Prisma,
} from '@prisma/client';
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
  type: 'single' | 'boolean' | 'text';
  value?: string | boolean;
  values?: string[];
  caseSensitive?: boolean;
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
  ): boolean {
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

    let correctCount = 0;
    const gradedAnswers = dto.answers.map((a) => {
      const question = questionMap.get(a.questionId);
      if (!question) {
        return {
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: false,
        };
      }
      const isCorrect = this.gradeAnswer(
        question.type,
        question.correctAnswer as CorrectAnswer,
        a.answer,
      );
      if (isCorrect) correctCount++;
      return {
        questionId: a.questionId,
        answer: a.answer,
        isCorrect,
        explanation: question.explanation,
        correctAnswer: question.correctAnswer,
      };
    });

    const score = Math.round((correctCount / attempt.totalCount) * 100);

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

    return {
      ...updated,
      passed: score >= updated.quiz.passingScore,
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
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException();
    return {
      ...attempt,
      passed: attempt.score != null && attempt.score >= attempt.quiz.passingScore,
    };
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
        quiz: { select: { subjectId: true, subject: { select: { code: true, name: true } } } },
      },
    });

    const totalAttempts = attempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts)
        : 0;
    const passed = attempts.filter(
      (a) => a.score != null && a.quiz && a.score >= 50,
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

    return {
      totalAttempts,
      avgScore,
      passed,
      recentAttempts: attempts.slice(0, 5),
      subjectStats,
      weakAreas,
    };
  }
}
