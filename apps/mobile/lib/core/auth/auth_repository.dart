import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/auth_response.dart';
import '../../models/user.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import 'auth_storage.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final AuthStorage _storage;

  Future<AuthResponse> login(String email, String password) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return _persistAuth(data);
  }

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      '/auth/register',
      data: {'email': email, 'password': password, 'fullName': fullName},
    );
    return _persistAuth(data);
  }

  Future<User?> restoreSession() async {
    final token = await _storage.readAccessToken();
    if (token == null || token.isEmpty) return null;

    try {
      final data = await _api.get<Map<String, dynamic>>('/users/me');
      final user = User.fromJson(data);
      await _storage.saveUserJson(data);
      return user;
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await _storage.clear();
      }
      return null;
    }
  }

  Future<void> logout() => _storage.clear();

  Future<AuthResponse> _persistAuth(Map<String, dynamic> data) async {
    final auth = AuthResponse.fromJson(data);
    await _storage.saveTokens(
      access: auth.tokens.accessToken,
      refresh: auth.tokens.refreshToken,
    );
    await _storage.saveUserJson(auth.user.toJson());
    return auth;
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(authStorageProvider),
  );
});
