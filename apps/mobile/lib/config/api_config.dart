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
}

class AppColors {
  AppColors._();

  static const primary = Color(0xFF1E40AF);
  static const primaryDark = Color(0xFF1E3A8A);
  static const accent = Color(0xFFF59E0B);
}
