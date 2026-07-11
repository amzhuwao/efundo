class ResourceSummary {
  const ResourceSummary({
    required this.id,
    required this.title,
    required this.type,
    required this.hasFile,
    required this.downloadCount,
    this.description,
    this.subjectCode,
    this.subjectName,
    this.fileName,
    this.fileSize,
    this.year,
    this.tags = const [],
  });

  final String id;
  final String title;
  final String type;
  final bool hasFile;
  final int downloadCount;
  final String? description;
  final String? subjectCode;
  final String? subjectName;
  final String? fileName;
  final int? fileSize;
  final int? year;
  final List<String> tags;

  factory ResourceSummary.fromJson(Map<String, dynamic> json) {
    final subject = json['subject'] as Map<String, dynamic>?;
    return ResourceSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      hasFile: json['hasFile'] as bool? ?? false,
      downloadCount: json['downloadCount'] as int? ?? 0,
      description: json['description'] as String?,
      subjectCode: subject?['code'] as String?,
      subjectName: subject?['name'] as String?,
      fileName: json['fileName'] as String?,
      fileSize: json['fileSize'] as int?,
      year: json['year'] as int?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
    );
  }
}

class PaginatedResources {
  const PaginatedResources({
    required this.data,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  final List<ResourceSummary> data;
  final int total;
  final int page;
  final int totalPages;

  factory PaginatedResources.fromJson(Map<String, dynamic> json) {
    final list = json['data'] as List<dynamic>? ?? [];
    return PaginatedResources(
      data: list
          .map((e) => ResourceSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? list.length,
      page: json['page'] as int? ?? 1,
      totalPages: json['totalPages'] as int? ?? 1,
    );
  }
}

String formatResourceType(String type) {
  const labels = {
    'PAST_PAPER': 'Past paper',
    'TEXTBOOK': 'Textbook',
    'LECTURE_NOTE': 'Lecture notes',
    'ASSIGNMENT': 'Assignment',
    'SOLUTION': 'Solution',
    'RESEARCH_PAPER': 'Research paper',
    'LAB_MANUAL': 'Lab manual',
    'REVISION_GUIDE': 'Revision guide',
    'SLIDES': 'Slides',
    'CASE_STUDY': 'Case study',
    'EXTERNAL_COURSE': 'External course',
  };
  return labels[type] ?? type;
}

String formatFileSize(int? bytes) {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
