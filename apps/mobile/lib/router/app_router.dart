import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../features/splash/splash_screen.dart';
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

CustomTransitionPage<void> _fadeSlide(Widget child, GoRouterState state) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.04, 0),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _RouterRefresh(ref),
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final onSplash = loc == '/splash';
      final loggingIn = loc == '/login' || loc == '/register';
      final status = auth.status;

      if (onSplash) return null;
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
        path: '/splash',
        pageBuilder: (context, state) =>
            const NoTransitionPage(child: SplashScreen()),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) =>
            _fadeSlide(const LoginScreen(), state),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) =>
            _fadeSlide(const RegisterScreen(), state),
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
                pageBuilder: (context, state) => _fadeSlide(
                  ResourceDetailScreen(
                    resourceId: state.pathParameters['id']!,
                  ),
                  state,
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
                pageBuilder: (context, state) => _fadeSlide(
                  TakeQuizScreen(quizId: state.pathParameters['quizId']!),
                  state,
                ),
              ),
              GoRoute(
                path: 'results/:attemptId',
                pageBuilder: (context, state) => _fadeSlide(
                  QuizResultsScreen(
                    attemptId: state.pathParameters['attemptId']!,
                  ),
                  state,
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
