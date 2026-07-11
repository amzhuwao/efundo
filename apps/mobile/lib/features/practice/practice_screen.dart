import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/api_config.dart';
import '../../models/quiz.dart';
import '../../providers/practice_provider.dart';

class PracticeScreen extends ConsumerWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quizzesAsync = ref.watch(quizzesProvider);
    final statsAsync = ref.watch(practiceStatsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Practice')),
      body: quizzesAsync.when(
        data: (quizzes) {
          final practice = quizzes.where((q) => !q.isMockExam).toList();
          final mocks = quizzes.where((q) => q.isMockExam).toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(quizzesProvider);
              ref.invalidate(practiceStatsProvider);
              await ref.read(quizzesProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                statsAsync.when(
                  data: (stats) => stats.totalAttempts > 0
                      ? Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _MiniStat('Attempts', '${stats.totalAttempts}'),
                                _MiniStat('Avg', '${stats.avgScore}%'),
                                _MiniStat('Passed', '${stats.passed}'),
                                _MiniStat('Certs', '${stats.certificates}'),
                              ],
                            ),
                          ),
                        )
                      : const SizedBox.shrink(),
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                if (mocks.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Mock exams',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  for (final q in mocks) _QuizTile(quiz: q),
                ],
                if (practice.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Practice quizzes',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  for (final q in practice) _QuizTile(quiz: q),
                ],
                if (quizzes.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 32),
                    child: Center(child: Text('No published quizzes yet')),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ],
    );
  }
}

class _QuizTile extends StatelessWidget {
  const _QuizTile({required this.quiz});

  final QuizSummary quiz;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => context.push('/practice/quiz/${quiz.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: quiz.isMockExam
                          ? Colors.amber.shade100
                          : AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      formatQuizType(quiz.type),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: quiz.isMockExam
                            ? Colors.amber.shade900
                            : AppColors.primary,
                      ),
                    ),
                  ),
                  if (quiz.subjectCode != null) ...[
                    const SizedBox(width: 8),
                    Text(
                      quiz.subjectCode!,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ],
                  const Spacer(),
                  const Icon(Icons.play_circle_outline, color: AppColors.primary),
                ],
              ),
              const SizedBox(height: 8),
              Text(quiz.title, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Text(
                '${quiz.questionCount} questions · pass ${quiz.passingScore}%'
                '${quiz.timeLimitMinutes != null ? ' · ${quiz.timeLimitMinutes} min' : ''}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
