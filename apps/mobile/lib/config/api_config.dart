import 'dart:ui' show Color;

/// API and app configuration.
class ApiConfig {
  ApiConfig._();

  /// Override at build/run time:
  /// Linux/Chrome: `flutter run -d linux`
  /// Android emulator: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1`
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001/api/v1',
  );

  static const String siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://efundo.org',
  );

  static String get accountDeletionUrl => '$siteUrl/account-deletion';
}

class AppColors {
  AppColors._();

  /// EfundoConnect UI blue (#1e40af)
  static const primary = Color(0xFF1E40AF);
  static const primaryDark = Color(0xFF1E3A8A);

  /// EfundoConnect purple (#7c3aed)
  static const purple = Color(0xFF7C3AED);

  /// Accent / link blue from Connect (#1863dc)
  static const accentBlue = Color(0xFF1863DC);

  /// Logo red ("e" in wordmark)
  static const accent = Color(0xFFE31E24);

  /// Logo bright blue ("fundo")
  static const logoBlue = Color(0xFF1D22D3);
}
