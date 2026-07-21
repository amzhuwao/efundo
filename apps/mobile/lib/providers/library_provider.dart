import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api/api_client.dart';
import '../core/auth/auth_storage.dart';
import '../models/resource.dart';

class LibraryRepository {
  LibraryRepository(this._api);

  final ApiClient _api;

  Future<PaginatedResources> search({
    String? query,
    int page = 1,
    int limit = 20,
  }) async {
    final data = await _api.get<Map<String, dynamic>>(
      '/library/resources',
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
        'page': page,
        'limit': limit,
      },
    );
    return PaginatedResources.fromJson(data);
  }

  Future<ResourceSummary> getResource(String id) async {
    final data = await _api.get<Map<String, dynamic>>('/library/resources/$id');
    return ResourceSummary.fromJson(data);
  }
}

class OfflineFileMeta {
  const OfflineFileMeta({
    required this.resourceId,
    required this.title,
    required this.fileName,
    required this.path,
    required this.sizeBytes,
    required this.savedAtMs,
    this.type,
  });

  final String resourceId;
  final String title;
  final String fileName;
  final String path;
  final int sizeBytes;
  final int savedAtMs;
  final String? type;

  Map<String, dynamic> toJson() => {
        'resourceId': resourceId,
        'title': title,
        'fileName': fileName,
        'path': path,
        'sizeBytes': sizeBytes,
        'savedAtMs': savedAtMs,
        'type': type,
      };

  factory OfflineFileMeta.fromJson(Map<String, dynamic> json) {
    return OfflineFileMeta(
      resourceId: json['resourceId'] as String,
      title: json['title'] as String? ?? json['fileName'] as String? ?? 'File',
      fileName: json['fileName'] as String? ?? 'file',
      path: json['path'] as String,
      sizeBytes: json['sizeBytes'] as int? ?? 0,
      savedAtMs: json['savedAtMs'] as int? ?? 0,
      type: json['type'] as String?,
    );
  }

  File get file => File(path);

  bool get exists => file.existsSync();
}

class OfflineDownloadService {
  OfflineDownloadService(this._api, this._storage);

  final ApiClient _api;
  final AuthStorage _storage;

  static const _indexKey = 'efundo_offline_index_v1';

  Future<Directory> _downloadsDir() async {
    final dir = await getApplicationDocumentsDirectory();
    final downloadsDir = Directory('${dir.path}/efundo_downloads');
    if (!await downloadsDir.exists()) {
      await downloadsDir.create(recursive: true);
    }
    return downloadsDir;
  }

  Future<List<OfflineFileMeta>> _readIndex() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_indexKey);
    if (raw == null || raw.isEmpty) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => OfflineFileMeta.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _writeIndex(List<OfflineFileMeta> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _indexKey,
      jsonEncode(items.map((e) => e.toJson()).toList()),
    );
  }

  Future<bool> isDownloaded(String resourceId) async {
    final items = await listDownloaded();
    return items.any((e) => e.resourceId == resourceId);
  }

  Future<OfflineFileMeta?> getDownloaded(String resourceId) async {
    final items = await listDownloaded();
    try {
      return items.firstWhere((e) => e.resourceId == resourceId);
    } catch (_) {
      return null;
    }
  }

  Future<OfflineFileMeta> downloadResource({
    required String resourceId,
    required String title,
    required String fileName,
    String? type,
    void Function(int received, int total)? onProgress,
  }) async {
    final token = await _storage.readAccessToken();
    if (token == null) throw Exception('Not authenticated');

    final meta = await _api.post<Map<String, dynamic>>(
      '/library/resources/$resourceId/download',
      data: {},
    );

    final url = meta['downloadUrl'] as String?;
    final name = meta['fileName'] as String? ?? fileName;
    if (url == null || url.isEmpty) throw Exception('No download URL');

    final downloadsDir = await _downloadsDir();
    final safeName = name.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    final uniqueName = '${resourceId}_$safeName';
    final file = File('${downloadsDir.path}/$uniqueName');

    await _api.dio.download(
      url,
      file.path,
      onReceiveProgress: onProgress,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        responseType: ResponseType.bytes,
        followRedirects: true,
        validateStatus: (s) => s != null && s < 500,
      ),
    );

    if (!await file.exists() || await file.length() == 0) {
      throw Exception('Download produced an empty file');
    }

    final item = OfflineFileMeta(
      resourceId: resourceId,
      title: title,
      fileName: name,
      path: file.path,
      sizeBytes: await file.length(),
      savedAtMs: DateTime.now().millisecondsSinceEpoch,
      type: type,
    );

    final index = await _readIndex();
    index.removeWhere((e) => e.resourceId == resourceId);
    // remove orphan old path if any
    index.removeWhere((e) => e.path == file.path);
    index.insert(0, item);
    await _writeIndex(index);
    return item;
  }

  Future<List<OfflineFileMeta>> listDownloaded() async {
    final index = await _readIndex();
    final kept = <OfflineFileMeta>[];
    for (final item in index) {
      if (item.exists) {
        kept.add(item);
      }
    }
    if (kept.length != index.length) {
      await _writeIndex(kept);
    }

    // Also pick up any files that exist on disk without index (legacy)
    final dir = await _downloadsDir();
    final knownPaths = kept.map((e) => e.path).toSet();
    for (final entity in dir.listSync().whereType<File>()) {
      if (knownPaths.contains(entity.path)) continue;
      final name = entity.uri.pathSegments.last;
      kept.add(
        OfflineFileMeta(
          resourceId: 'legacy_${name.hashCode}',
          title: name,
          fileName: name,
          path: entity.path,
          sizeBytes: entity.lengthSync(),
          savedAtMs: entity.lastModifiedSync().millisecondsSinceEpoch,
        ),
      );
    }
    kept.sort((a, b) => b.savedAtMs.compareTo(a.savedAtMs));
    return kept;
  }

  Future<void> deleteDownloaded(String resourceId) async {
    final index = await _readIndex();
    final match = index.where((e) => e.resourceId == resourceId).toList();
    for (final item in match) {
      final f = item.file;
      if (await f.exists()) await f.delete();
    }
    index.removeWhere((e) => e.resourceId == resourceId);
    await _writeIndex(index);
  }

  /// Back-compat helper used by older screens.
  Future<File> downloadResourceLegacy(String resourceId, String fileName) async {
    final item = await downloadResource(
      resourceId: resourceId,
      title: fileName,
      fileName: fileName,
    );
    return item.file;
  }

  Future<List<File>> listDownloadedFiles() async {
    final items = await listDownloaded();
    return items.map((e) => e.file).toList();
  }
}

final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  return LibraryRepository(ref.watch(apiClientProvider));
});

final offlineDownloadProvider = Provider<OfflineDownloadService>((ref) {
  return OfflineDownloadService(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
  );
});

final offlineFilesProvider =
    FutureProvider.autoDispose<List<OfflineFileMeta>>((ref) async {
  return ref.watch(offlineDownloadProvider).listDownloaded();
});

final librarySearchProvider =
    FutureProvider.family<PaginatedResources, String>((ref, query) async {
  return ref.watch(libraryRepositoryProvider).search(query: query);
});

final resourceDetailProvider =
    FutureProvider.family<ResourceSummary, String>((ref, id) async {
  return ref.watch(libraryRepositoryProvider).getResource(id);
});
