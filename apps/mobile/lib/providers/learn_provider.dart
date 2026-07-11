import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api/api_client.dart';
import '../models/learn.dart';

class LearnRepository {
  LearnRepository(this._api);

  final ApiClient _api;

  Future<List<SubjectSummary>> listSubjects() async {
    final catalog = await _api.get<List<dynamic>>('/lms/catalog');
    final subjects = <SubjectSummary>[];
    for (final level in catalog) {
      final levelMap = level as Map<String, dynamic>;
      final programs = levelMap['programs'] as List<dynamic>? ?? [];
      for (final program in programs) {
        final programMap = program as Map<String, dynamic>;
        final programName = programMap['name'] as String?;
        final subjectList = programMap['subjects'] as List<dynamic>? ?? [];
        for (final s in subjectList) {
          final map = Map<String, dynamic>.from(s as Map<String, dynamic>);
          map['programName'] = programName;
          subjects.add(SubjectSummary.fromJson(map));
        }
      }
    }
    return subjects;
  }

  Future<List<ModuleSummary>> listModules(String subjectId) async {
    final data = await _api.get<List<dynamic>>(
      '/lms/subjects/$subjectId/modules',
    );
    return data
        .map((e) => ModuleSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

final learnRepositoryProvider = Provider<LearnRepository>((ref) {
  return LearnRepository(ref.watch(apiClientProvider));
});

final subjectsProvider = FutureProvider<List<SubjectSummary>>((ref) async {
  return ref.watch(learnRepositoryProvider).listSubjects();
});

final modulesProvider =
    FutureProvider.family<List<ModuleSummary>, String>((ref, subjectId) async {
  return ref.watch(learnRepositoryProvider).listModules(subjectId);
});
