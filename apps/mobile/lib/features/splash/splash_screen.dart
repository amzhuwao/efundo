import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Branded animated splash shown once at cold start.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  late final AnimationController _barCtrl;
  late final AnimationController _fadeCtrl;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _barWidth;
  late final Animation<double> _fadeOut;

  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _barCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );

    _logoScale = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOutBack);
    _logoOpacity = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOut);
    _barWidth = CurvedAnimation(parent: _barCtrl, curve: Curves.easeOutCubic);
    _fadeOut = Tween<double>(begin: 1, end: 0).animate(
      CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeIn),
    );

    _run();
  }

  Future<void> _run() async {
    await _logoCtrl.forward();
    await _barCtrl.forward();
    await Future<void>.delayed(const Duration(milliseconds: 650));

    // Wait briefly for auth to resolve if still unknown
    for (var i = 0; i < 20; i++) {
      final status = ref.read(authProvider).status;
      if (status != AuthStatus.unknown) break;
      await Future<void>.delayed(const Duration(milliseconds: 100));
    }

    if (!mounted) return;
    await _fadeCtrl.forward();
    if (!mounted) return;

    final status = ref.read(authProvider).status;
    if (status == AuthStatus.authenticated) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _barCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: FadeTransition(
        opacity: _fadeOut,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              FadeTransition(
                opacity: _logoOpacity,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.72, end: 1).animate(_logoScale),
                  child: Image.asset(
                    'assets/brand/logo.png',
                    width: 260,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => _FallbackLogo(),
                  ),
                ),
              ),
              const SizedBox(height: 28),
              AnimatedBuilder(
                animation: _barWidth,
                builder: (context, _) {
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: SizedBox(
                      width: 180 * _barWidth.value.clamp(0.05, 1),
                      height: 4,
                      child: const LinearProgressIndicator(
                        backgroundColor: Color(0xFFE8E8EE),
                        color: AppColors.primary,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 18),
              FadeTransition(
                opacity: _logoOpacity,
                child: Text(
                  'ONLINE EDUCATION',
                  style: TextStyle(
                    letterSpacing: 3.2,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FallbackLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: const TextSpan(
        style: TextStyle(
          fontSize: 52,
          fontWeight: FontWeight.w800,
          fontStyle: FontStyle.italic,
          letterSpacing: -1,
        ),
        children: [
          TextSpan(text: 'e', style: TextStyle(color: AppColors.accent)),
          TextSpan(text: 'fundo', style: TextStyle(color: AppColors.primary)),
        ],
      ),
    );
  }
}
