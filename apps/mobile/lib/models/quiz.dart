class McqOption {
  const McqOption({required this.id, required this.text});

  final String id;
  final String text;

  factory McqOption.fromJson(Map<String, dynamic> json) {
    return McqOption(
      id: json['id'] as String,
      text: json['text'] as String,
    );
  }
}

class QuizQuestion {
  const QuizQuestion({
    required this.id,
    required this.type,
    required this.stem,
    required this.difficulty,
    this.options = const [],
    this.tags = const [],
  });

  final String id;
  final String type;
  final String stem;
  final String difficulty;
  final List<McqOption> options;
  final List<String> tags;

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    final opts = json['options'] as List<dynamic>? ?? [];
    return QuizQuestion(
      id: json['id'] as String,
      type: json['type'] as String,
      stem: json['stem'] as String,
      difficulty: json['difficulty'] as String? ?? 'BEGINNER',
      options: opts
          .map((e) => McqOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
    );
  }
}

class QuizAttemptStart {
  const QuizAttemptStart({
    required this.attemptId,
    required this.quiz,
    required this.questions,
    this.expiresAt,
  });

  final String attemptId;
  final QuizSessionInfo quiz;
  final List<QuizQuestion> questions;
  final DateTime? expiresAt;

  factory QuizAttemptStart.fromJson(Map<String, dynamic> json) {
    final questions = json['questions'] as List<dynamic>? ?? [];
    return QuizAttemptStart(
      attemptId: json['attemptId'] as String,
      quiz: QuizSessionInfo.fromJson(json['quiz'] as Map<String, dynamic>),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
      questions: questions
          .map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class QuizSessionInfo {
  const QuizSessionInfo({
    required this.id,
    required this.title,
    required this.type,
    required this.allowBacktrack,
    required this.passingScore,
    this.timeLimitMinutes,
  });

  final String id;
  final String title;
  final String type;
  final bool allowBacktrack;
  final int passingScore;
  final int? timeLimitMinutes;

  factory QuizSessionInfo.fromJson(Map<String, dynamic> json) {
    return QuizSessionInfo(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      allowBacktrack: json['allowBacktrack'] as bool? ?? true,
      passingScore: json['passingScore'] as int? ?? 50,
      timeLimitMinutes: json['timeLimitMinutes'] as int?,
    );
  }
}

class GradedAnswer {
  const GradedAnswer({
    required this.questionId,
    required this.answer,
    this.isCorrect,
    this.pendingReview = false,
    this.explanation,
    this.correctAnswer,
    this.rubric,
  });

  final String questionId;
  final dynamic answer;
  final bool? isCorrect;
  final bool pendingReview;
  final String? explanation;
  final dynamic correctAnswer;
  final String? rubric;

  factory GradedAnswer.fromJson(Map<String, dynamic> json) {
    return GradedAnswer(
      questionId: json['questionId'] as String,
      answer: json['answer'],
      isCorrect: json['isCorrect'] as bool?,
      pendingReview: json['pendingReview'] as bool? ?? false,
      explanation: json['explanation'] as String?,
      correctAnswer: json['correctAnswer'],
      rubric: json['rubric'] as String?,
    );
  }
}

class QuizCertificateRef {
  const QuizCertificateRef({
    required this.id,
    required this.code,
    required this.issuedAt,
  });

  final String id;
  final String code;
  final DateTime issuedAt;

  factory QuizCertificateRef.fromJson(Map<String, dynamic> json) {
    return QuizCertificateRef(
      id: json['id'] as String,
      code: json['code'] as String,
      issuedAt: DateTime.parse(json['issuedAt'] as String),
    );
  }
}

class QuizAttemptResult {
  const QuizAttemptResult({
    required this.id,
    required this.totalCount,
    required this.passed,
    required this.quiz,
    this.score,
    this.correctCount,
    this.answers = const [],
    this.submittedAt,
    this.hasPendingEssays = false,
    this.certificate,
  });

  final String id;
  final int? score;
  final int? correctCount;
  final int totalCount;
  final bool passed;
  final bool hasPendingEssays;
  final List<GradedAnswer> answers;
  final DateTime? submittedAt;
  final QuizResultInfo quiz;
  final QuizCertificateRef? certificate;

  factory QuizAttemptResult.fromJson(Map<String, dynamic> json) {
    final answers = json['answers'];
    final list = answers is List ? answers : <dynamic>[];
    final cert = json['certificate'] as Map<String, dynamic>?;
    return QuizAttemptResult(
      id: json['id'] as String,
      score: json['score'] as int?,
      correctCount: json['correctCount'] as int?,
      totalCount: json['totalCount'] as int? ?? list.length,
      passed: json['passed'] as bool? ?? false,
      hasPendingEssays: json['hasPendingEssays'] as bool? ?? false,
      submittedAt: json['submittedAt'] != null
          ? DateTime.tryParse(json['submittedAt'] as String)
          : null,
      answers: list
          .map((e) => GradedAnswer.fromJson(e as Map<String, dynamic>))
          .toList(),
      quiz: QuizResultInfo.fromJson(json['quiz'] as Map<String, dynamic>),
      certificate: cert != null ? QuizCertificateRef.fromJson(cert) : null,
    );
  }
}

class QuizResultInfo {
  const QuizResultInfo({
    required this.id,
    required this.title,
    required this.type,
    required this.passingScore,
    required this.subjectCode,
    required this.subjectName,
  });

  final String id;
  final String title;
  final String type;
  final int passingScore;
  final String subjectCode;
  final String subjectName;

  factory QuizResultInfo.fromJson(Map<String, dynamic> json) {
    final subject = json['subject'] as Map<String, dynamic>?;
    return QuizResultInfo(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      passingScore: json['passingScore'] as int? ?? 50,
      subjectCode: subject?['code'] as String? ?? '',
      subjectName: subject?['name'] as String? ?? '',
    );
  }
}

class QuizSummary {
  const QuizSummary({
    required this.id,
    required this.title,
    required this.type,
    required this.questionCount,
    required this.passingScore,
    this.description,
    this.timeLimitMinutes,
    this.subjectCode,
    this.subjectName,
  });

  final String id;
  final String title;
  final String type;
  final int questionCount;
  final int passingScore;
  final String? description;
  final int? timeLimitMinutes;
  final String? subjectCode;
  final String? subjectName;

  factory QuizSummary.fromJson(Map<String, dynamic> json) {
    final subject = json['subject'] as Map<String, dynamic>?;
    return QuizSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      questionCount: json['questionCount'] as int? ?? 0,
      passingScore: json['passingScore'] as int? ?? 50,
      description: json['description'] as String?,
      timeLimitMinutes: json['timeLimitMinutes'] as int?,
      subjectCode: subject?['code'] as String?,
      subjectName: subject?['name'] as String?,
    );
  }

  bool get isMockExam => type == 'MOCK_EXAM';
}

class PerformanceStats {
  const PerformanceStats({
    required this.totalAttempts,
    required this.avgScore,
    required this.passed,
    required this.certificates,
  });

  final int totalAttempts;
  final int avgScore;
  final int passed;
  final int certificates;

  factory PerformanceStats.fromJson(Map<String, dynamic> json) {
    return PerformanceStats(
      totalAttempts: json['totalAttempts'] as int? ?? 0,
      avgScore: json['avgScore'] as int? ?? 0,
      passed: json['passed'] as int? ?? 0,
      certificates: json['certificates'] as int? ?? 0,
    );
  }
}

String formatQuizType(String type) =>
    type == 'MOCK_EXAM' ? 'Mock exam' : 'Practice quiz';

String formatCorrectAnswer(dynamic ca) {
  if (ca is! Map) return ca?.toString() ?? '';
  final map = Map<String, dynamic>.from(ca);
  if (map['type'] == 'boolean') return map['value'] == true ? 'True' : 'False';
  if (map['type'] == 'single') return map['value']?.toString() ?? '';
  if (map['type'] == 'essay') {
    return map['sampleAnswer']?.toString() ?? 'See rubric';
  }
  final values = map['values'];
  if (values is List) return values.join(' / ');
  return map['value']?.toString() ?? '';
}
