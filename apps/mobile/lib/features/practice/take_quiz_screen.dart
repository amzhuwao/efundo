import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/api_config.dart';
import '../../models/quiz.dart';
import '../../providers/practice_provider.dart';

class TakeQuizScreen extends ConsumerStatefulWidget {
  const TakeQuizScreen({super.key, required this.quizId});

  final String quizId;

  @override
  ConsumerState<TakeQuizScreen> createState() => _TakeQuizScreenState();
}

class _TakeQuizScreenState extends ConsumerState<TakeQuizScreen> {
  QuizAttemptStart? _session;
  String? _error;
  var _loading = true;
  var _submitting = false;
  var _currentIndex = 0;
  final Map<String, dynamic> _answers = {};
  final Map<String, TextEditingController> _textControllers = {};
  Timer? _timer;
  int? _timeLeftSeconds;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _textControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _controllerFor(String questionId) {
    return _textControllers.putIfAbsent(
      questionId,
      () => TextEditingController(
        text: _answers[questionId] is String ? _answers[questionId] as String : '',
      ),
    );
  }

  Future<void> _start() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final session =
          await ref.read(practiceRepositoryProvider).startQuiz(widget.quizId);
      if (!mounted) return;
      setState(() {
        _session = session;
        _loading = false;
        if (session.expiresAt != null) {
          _timeLeftSeconds = session.expiresAt!
              .difference(DateTime.now())
              .inSeconds
              .clamp(0, 24 * 60 * 60);
          _startTimer();
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'ApiException\(\d+\):\s*'), '');
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _timeLeftSeconds == null) return;
      if (_timeLeftSeconds! <= 1) {
        _timer?.cancel();
        setState(() => _timeLeftSeconds = 0);
        _submit();
        return;
      }
      setState(() => _timeLeftSeconds = _timeLeftSeconds! - 1);
    });
  }

  Future<void> _submit() async {
    final session = _session;
    if (session == null || _submitting) return;
    setState(() => _submitting = true);
    try {
      final result = await ref.read(practiceRepositoryProvider).submitAttempt(
            attemptId: session.attemptId,
            answers: Map<String, dynamic>.from(_answers),
          );
      if (!mounted) return;
      ref.invalidate(practiceStatsProvider);
      ref.invalidate(quizzesProvider);
      context.go('/practice/results/${result.id}');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString().replaceFirst(RegExp(r'ApiException\(\d+\):\s*'), '');
      });
    }
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_session == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Practice')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error ?? 'Could not start quiz'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/practice'),
                  child: const Text('Back to practice'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final session = _session!;
    final questions = session.questions;
    final current = questions[_currentIndex];
    final answeredCount = _answers.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(session.quiz.title),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/practice'),
        ),
        actions: [
          if (_timeLeftSeconds != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: _timeLeftSeconds! < 300
                        ? Colors.red.shade100
                        : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _formatTime(_timeLeftSeconds!),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                      color: _timeLeftSeconds! < 300
                          ? Colors.red.shade800
                          : Colors.grey.shade800,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentIndex + 1) / questions.length,
            minHeight: 4,
            backgroundColor: Colors.grey.shade200,
            color: AppColors.primary,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Text(
                  formatQuizType(session.quiz.type),
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '$answeredCount/${questions.length} answered',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                ),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade700)),
              ),
            ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Question ${_currentIndex + 1} of ${questions.length}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade500,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  current.stem,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 20),
                _buildAnswerInput(current),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                children: [
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: questions.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (context, i) {
                        final answered = _answers.containsKey(questions[i].id);
                        final selected = i == _currentIndex;
                        return InkWell(
                          onTap: () {
                            if (session.quiz.allowBacktrack || i >= _currentIndex) {
                              setState(() => _currentIndex = i);
                            }
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            width: 36,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primary
                                  : answered
                                      ? Colors.green.shade100
                                      : Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: selected
                                    ? Colors.white
                                    : answered
                                        ? Colors.green.shade800
                                        : Colors.grey.shade700,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: _currentIndex == 0 || !session.quiz.allowBacktrack
                            ? null
                            : () => setState(() => _currentIndex--),
                        child: const Text('Previous'),
                      ),
                      const Spacer(),
                      if (_currentIndex < questions.length - 1)
                        FilledButton(
                          onPressed: () => setState(() => _currentIndex++),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                          ),
                          child: const Text('Next'),
                        )
                      else
                        FilledButton(
                          onPressed: _submitting ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.green.shade700,
                          ),
                          child: Text(_submitting ? 'Submitting…' : 'Submit quiz'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnswerInput(QuizQuestion question) {
    switch (question.type) {
      case 'TRUE_FALSE':
        return Column(
          children: [
            for (final opt in [(true, 'True'), (false, 'False')])
              _ChoiceTile(
                selected: _answers[question.id] == opt.$1,
                label: opt.$2,
                onTap: () => setState(() => _answers[question.id] = opt.$1),
              ),
          ],
        );
      case 'MULTIPLE_CHOICE':
        return Column(
          children: [
            for (final opt in question.options)
              _ChoiceTile(
                selected: _answers[question.id] == opt.id,
                label: opt.text,
                onTap: () => setState(() => _answers[question.id] = opt.id),
              ),
          ],
        );
      case 'ESSAY':
        return TextField(
          maxLines: 8,
          controller: _controllerFor(question.id),
          decoration: const InputDecoration(
            hintText: 'Write your essay response…',
            alignLabelWithHint: true,
          ),
          onChanged: (v) => setState(() => _answers[question.id] = v),
        );
      case 'SHORT_ANSWER':
      case 'FILL_BLANK':
      default:
        return TextField(
          controller: _controllerFor(question.id),
          decoration: const InputDecoration(hintText: 'Type your answer…'),
          onChanged: (v) => setState(() => _answers[question.id] = v),
        );
    }
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({
    required this.selected,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : Colors.grey.shade300,
            ),
            color: selected ? AppColors.primary.withValues(alpha: 0.06) : null,
          ),
          child: Row(
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? AppColors.primary : Colors.grey,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(label)),
            ],
          ),
        ),
      ),
    );
  }
}
