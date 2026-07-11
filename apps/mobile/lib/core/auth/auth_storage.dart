import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kAccess = 'efundo_access_token';
const _kRefresh = 'efundo_refresh_token';
const _kUser = 'efundo_user_json';

class AuthStorage {
  AuthStorage({SharedPreferences? prefs}) : _prefs = prefs;

  SharedPreferences? _prefs;

  Future<SharedPreferences> _instance() async {
    return _prefs ??= await SharedPreferences.getInstance();
  }

  Future<void> saveTokens({
    required String access,
    required String refresh,
  }) async {
    final prefs = await _instance();
    await prefs.setString(_kAccess, access);
    await prefs.setString(_kRefresh, refresh);
  }

  Future<void> saveUserJson(Map<String, dynamic> user) async {
    final prefs = await _instance();
    await prefs.setString(_kUser, jsonEncode(user));
  }

  Future<String?> readAccessToken() async {
    final prefs = await _instance();
    return prefs.getString(_kAccess);
  }

  Future<String?> readRefreshToken() async {
    final prefs = await _instance();
    return prefs.getString(_kRefresh);
  }

  Future<Map<String, dynamic>?> readUserJson() async {
    final prefs = await _instance();
    final raw = prefs.getString(_kUser);
    if (raw == null || raw.isEmpty) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> clear() async {
    final prefs = await _instance();
    await prefs.remove(_kAccess);
    await prefs.remove(_kRefresh);
    await prefs.remove(_kUser);
  }
}

final authStorageProvider = Provider<AuthStorage>((ref) => AuthStorage());
