import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/api_config.dart';
import '../auth/auth_storage.dart';
import 'api_exception.dart';

typedef TokenReader = Future<String?> Function();
typedef TokenRefresher = Future<String?> Function();

class ApiClient {
  ApiClient({
    required AuthStorage storage,
    Dio? dio,
  })  : _storage = storage,
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: ApiConfig.baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 30),
                headers: {'Content-Type': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!options.path.startsWith('/auth/')) {
            final token = await _storage.readAccessToken();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final response = error.response;
          if (response?.statusCode == 401 &&
              !error.requestOptions.path.startsWith('/auth/') &&
              error.requestOptions.extra['retried'] != true) {
            final newToken = await _refreshAccessToken();
            if (newToken != null) {
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newToken';
              opts.extra['retried'] = true;
              try {
                final retry = await _dio.fetch(opts);
                return handler.resolve(retry);
              } catch (e) {
                return handler.next(error);
              }
            }
            await _storage.clear();
          }
          handler.next(error);
        },
      ),
    );
  }

  final AuthStorage _storage;
  final Dio _dio;
  Future<String?>? _refreshFuture;

  Dio get dio => _dio;

  Future<String?> _refreshAccessToken() async {
    _refreshFuture ??= _doRefresh().whenComplete(() => _refreshFuture = null);
    return _refreshFuture;
  }

  Future<String?> _doRefresh() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return null;

    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(extra: {'retried': true}),
      );
      final data = res.data;
      if (data == null) return null;

      final tokens = data['tokens'] as Map<String, dynamic>?;
      if (tokens == null) return null;

      final access = tokens['accessToken'] as String?;
      final refresh = tokens['refreshToken'] as String?;
      if (access == null || refresh == null) return null;

      await _storage.saveTokens(access: access, refresh: refresh);
      if (data['user'] != null) {
        await _storage.saveUserJson(data['user'] as Map<String, dynamic>);
      }
      return access;
    } catch (_) {
      await _storage.clear();
      return null;
    }
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _request(() => _dio.get<T>(path, queryParameters: queryParameters));
  }

  Future<T> post<T>(String path, {Object? data}) async {
    return _request(() => _dio.post<T>(path, data: data));
  }

  Future<T> patch<T>(String path, {Object? data}) async {
    return _request(() => _dio.patch<T>(path, data: data));
  }

  Future<T> delete<T>(String path) async {
    return _request(() => _dio.delete<T>(path));
  }

  Future<T> _request<T>(Future<Response<T>> Function() call) async {
    try {
      final response = await call();
      final data = response.data;
      if (data == null) {
        throw ApiException(0, 'Empty response');
      }
      return data;
    } on DioException catch (e) {
      final status = e.response?.statusCode ?? 0;
      final body = e.response?.data;
      throw ApiException(status, _parseMessage(body));
    }
  }

  String _parseMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) return message;
      if (message is List) return message.join(', ');
    }
    return 'Request failed';
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(authStorageProvider);
  return ApiClient(storage: storage);
});
