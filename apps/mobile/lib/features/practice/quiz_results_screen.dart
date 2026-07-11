import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/api_config.dart';
import '../../models/quiz.dart';
import '../../providers/practice_provider.dart';

class QuizResultsScreen extends ConsumerWidget {
  const QuizResultsScreen({super.key, required this.attemptId});

  final String attemptId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultAsync = ref.watch(attemptResultProvider(attemptId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Results'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/practice'),
        ),
      ),
      body: resultAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (result) {
          final Color bannerBg;
          final Color bannerFg;
          final String statusLabel;
          if (result.passed) {
            bannerBg = Colors.green.shade50;
            bannerFg = Colors.green.shade800;
            statusLabel = 'Passed';
          } else if (result.hasPendingEssays) {
            bannerBg = Colors.blue.shade50;
            bannerFg = Colors.blue.shade800;
            statusLabel = 'Essay responses awaiting review';
          } else {
            bannerBg = Colors.amber.shade50;
            bannerFg = Colors.amber.shade900;
            statusLabel = 'Need ${result.quiz.passingScore}% to pass';
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: bannerBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: bannerFg.withValues(alpha: 0.2)),
                ),
                child: Column(
                  children: [
                    Text(
                      formatQuizType(result.quiz.type),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      result.quiz.title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      result.quiz.subjectCode,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      result.score != null ? '${result.score}%' : '—',
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${result.correctCount ?? 0} / ${result.totalCount} auto-graded correct',
                    ),
                    const SizedBox(height: 8),
                    Text(
                      statusLabel,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: bannerFg,
                      ),
                    ),
                    if (result.certificate != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        'Certificate ${result.certificate!.code}',
                        style: const TextStyle(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () =>
                          context.go('/practice/quiz/${result.quiz.id}'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                      ),
                      child: const Text('Try again'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.go('/practice'),
                      child: const Text('All quizzes'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Review answers',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              for (var i = 0; i < result.answers.length; i++)
                _AnswerCard(index: i, item: result.answers[i]),
            ],
          );
        },
      ),
    );
  }
}

class _AnswerCard extends StatelessWidget {
  const _AnswerCard({required this.index, required this.item});

  final int index;
  final GradedAnswer item;

  @override
  Widget build(BuildContext context) {
    final pending = item.isCorrect == null || item.pendingReview;
    final Color border;
    final Color bg;
    final String label;
    final Color labelColor;

    if (pending) {
      border = Colors.blue.shade200;
      bg = Colors.blue.shade50;
      label = 'Submitted for review';
      labelColor = Colors.blue.shade800;
    } else if (item.isCorrect == true) {
      border = Colors.green.shade200;
      bg = Colors.green.shade50;
      label = 'Correct';
      labelColor = Colors.green.shade800;
    } else {
      border = Colors.red.shade200;
      bg = Colors.red.shade50;
      label = 'Incorrect';
      labelColor = Colors.red.shade800;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Q${index + 1}. ',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  TextSpan(
                    text: label,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: labelColor,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your answer: ${item.answer?.toString().isEmpty == true ? '(no answer)' : item.answer}',
            ),
            if (!pending && item.isCorrect != true && item.correctAnswer != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Correct: ${formatCorrectAnswer(item.correctAnswer)}',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ),
            if (item.rubric != null && item.rubric!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Rubric: ${item.rubric}',
                  style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                ),
              ),
            if (item.explanation != null && item.explanation!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    item.explanation!,
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
