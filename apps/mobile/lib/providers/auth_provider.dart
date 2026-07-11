import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth/auth_repository.dart';
import '../models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.error,
  });

  final AuthStatus status;
  final User? user;
  final String? error;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _bootstrap();
    return const AuthState(status: AuthStatus.unknown);
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  Future<void> _bootstrap() async {
    final user = await _repo.restoreSession();
    state = AuthState(
      status: user != null ? AuthStatus.authenticated : AuthStatus.unauthenticated,
      user: user,
    );
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(clearError: true);
    try {
      final res = await _repo.login(email, password);
      state = AuthState(status: AuthStatus.authenticated, user: res.user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: _friendlyError(e),
      );
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    state = state.copyWith(clearError: true);
    try {
      final res = await _repo.register(
        email: email,
        password: password,
        fullName: fullName,
      );
      state = AuthState(status: AuthStatus.authenticated, user: res.user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: _friendlyError(e),
      );
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  String _friendlyError(Object e) {
    final text = e.toString();
    final match = RegExp(r'ApiException\(\d+\):\s*(.*)').firstMatch(text);
    return match?.group(1) ?? text;
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
