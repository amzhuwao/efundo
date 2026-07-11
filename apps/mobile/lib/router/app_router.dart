import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/home/home_screen.dart';
import '../features/library/library_screen.dart';
import '../features/library/resource_detail_screen.dart';
import '../features/learn/learn_screen.dart';
import '../features/practice/practice_screen.dart';
import '../features/practice/take_quiz_screen.dart';
import '../features/practice/quiz_results_screen.dart';
import '../features/profile/profile_screen.dart';
import '../widgets/main_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: _RouterRefresh(ref),
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      final status = auth.status;

      if (status == AuthStatus.unknown) return null;

      if (status == AuthStatus.unauthenticated && !loggingIn) {
        return '/login';
      }
      if (status == AuthStatus.authenticated && loggingIn) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: '/library',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: LibraryScreen()),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) => ResourceDetailScreen(
                  resourceId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/learn',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: LearnScreen()),
          ),
          GoRoute(
            path: '/practice',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: PracticeScreen()),
            routes: [
              GoRoute(
                path: 'quiz/:quizId',
                builder: (context, state) => TakeQuizScreen(
                  quizId: state.pathParameters['quizId']!,
                ),
              ),
              GoRoute(
                path: 'results/:attemptId',
                builder: (context, state) => QuizResultsScreen(
                  attemptId: state.pathParameters['attemptId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('eFundo')),
      body: Center(child: Text(state.error.toString())),
    ),
  );
});

class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(this.ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }

  final Ref ref;
}
