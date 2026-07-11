import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:efundo_mobile/app.dart';

void main() {
  testWidgets('App boots to loading or login', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: EfundoApp()));
    await tester.pump();

    expect(find.byType(EfundoApp), findsOneWidget);
  });
}
