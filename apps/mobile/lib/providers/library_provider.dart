import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

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

class OfflineDownloadService {
  OfflineDownloadService(this._api, this._storage);

  final ApiClient _api;
  final AuthStorage _storage;

  Future<File> downloadResource(String resourceId, String fileName) async {
    final token = await _storage.readAccessToken();
    if (token == null) throw Exception('Not authenticated');

    final meta = await _api.post<Map<String, dynamic>>(
      '/library/resources/$resourceId/download',
      data: {},
    );

    final url = meta['downloadUrl'] as String?;
    final name = meta['fileName'] as String? ?? fileName;
    if (url == null) throw Exception('No download URL');

    final dir = await getApplicationDocumentsDirectory();
    final downloadsDir = Directory('${dir.path}/efundo_downloads');
    if (!await downloadsDir.exists()) {
      await downloadsDir.create(recursive: true);
    }

    final safeName = name.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    final file = File('${downloadsDir.path}/$safeName');

    await _api.dio.download(
      url,
      file.path,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        responseType: ResponseType.bytes,
      ),
    );

    return file;
  }

  Future<List<File>> listDownloadedFiles() async {
    final dir = await getApplicationDocumentsDirectory();
    final downloadsDir = Directory('${dir.path}/efundo_downloads');
    if (!await downloadsDir.exists()) return [];
    return downloadsDir
        .listSync()
        .whereType<File>()
        .toList()
      ..sort((a, b) => b.lastModifiedSync().compareTo(a.lastModifiedSync()));
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

final librarySearchProvider =
    FutureProvider.family<PaginatedResources, String>((ref, query) async {
  return ref.watch(libraryRepositoryProvider).search(query: query);
});

final resourceDetailProvider =
    FutureProvider.family<ResourceSummary, String>((ref, id) async {
  return ref.watch(libraryRepositoryProvider).getResource(id);
});
