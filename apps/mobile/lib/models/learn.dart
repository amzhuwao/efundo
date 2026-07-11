class SubjectSummary {
  const SubjectSummary({
    required this.id,
    required this.code,
    required this.name,
    this.programName,
  });

  final String id;
  final String code;
  final String name;
  final String? programName;

  factory SubjectSummary.fromJson(Map<String, dynamic> json) {
    return SubjectSummary(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      programName: json['programName'] as String?,
    );
  }
}

class ModuleSummary {
  const ModuleSummary({
    required this.id,
    required this.title,
    required this.lessonCount,
    this.description,
  });

  final String id;
  final String title;
  final int lessonCount;
  final String? description;

  factory ModuleSummary.fromJson(Map<String, dynamic> json) {
    final topics = json['topics'] as List<dynamic>? ?? [];
    var lessons = 0;
    for (final t in topics) {
      final topic = t as Map<String, dynamic>;
      lessons += (topic['lessons'] as List<dynamic>? ?? []).length;
    }
    return ModuleSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      lessonCount: lessons,
      description: json['description'] as String?,
    );
  }
}
