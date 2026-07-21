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
    defaultValue: 'http://209.38.225.150',
  );

  static String get accountDeletionUrl => '$siteUrl/account-deletion';
}

class AppColors {
  AppColors._();

  /// Brand blue from eFundo logo ("fundo")
  static const primary = Color(0xFF1D22D3);
  static const primaryDark = Color(0xFF1518A8);
  /// Brand red from eFundo logo ("e")
  static const accent = Color(0xFFE31E24);
}
