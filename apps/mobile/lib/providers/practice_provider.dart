import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/api_client.dart';
import '../models/quiz.dart';

class PracticeRepository {
  PracticeRepository(this._api);

  final ApiClient _api;

  Future<List<QuizSummary>> listQuizzes({String? subjectId}) async {
    final data = await _api.get<List<dynamic>>(
      '/assessment/quizzes',
      queryParameters: {
        if (subjectId != null && subjectId.isNotEmpty) 'subjectId': subjectId,
      },
    );
    return data
        .map((e) => QuizSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PerformanceStats> getStats() async {
    final data = await _api.get<Map<String, dynamic>>('/assessment/stats/me');
    return PerformanceStats.fromJson(data);
  }

  Future<QuizAttemptStart> startQuiz(String quizId) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/assessment/quizzes/$quizId/start',
      data: {},
    );
    return QuizAttemptStart.fromJson(data);
  }

  Future<QuizAttemptResult> submitAttempt({
    required String attemptId,
    required Map<String, dynamic> answers,
  }) async {
    final payload = answers.entries
        .map((e) => {'questionId': e.key, 'answer': e.value})
        .toList();
    final data = await _api.post<Map<String, dynamic>>(
      '/assessment/attempts/$attemptId/submit',
      data: {'answers': payload},
    );
    return QuizAttemptResult.fromJson(data);
  }

  Future<QuizAttemptResult> getAttempt(String attemptId) async {
    final data =
        await _api.get<Map<String, dynamic>>('/assessment/attempts/$attemptId');
    return QuizAttemptResult.fromJson(data);
  }
}

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  return PracticeRepository(ref.watch(apiClientProvider));
});

final quizzesProvider = FutureProvider<List<QuizSummary>>((ref) async {
  return ref.watch(practiceRepositoryProvider).listQuizzes();
});

final practiceStatsProvider = FutureProvider<PerformanceStats>((ref) async {
  return ref.watch(practiceRepositoryProvider).getStats();
});

final attemptResultProvider =
    FutureProvider.family<QuizAttemptResult, String>((ref, attemptId) async {
  return ref.watch(practiceRepositoryProvider).getAttempt(attemptId);
});
