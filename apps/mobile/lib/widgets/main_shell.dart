import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});

  final Widget child;

  static const _tabs = [
    _Tab('/home', Icons.home_outlined, Icons.home, 'Home'),
    _Tab('/library', Icons.folder_outlined, Icons.folder, 'Library'),
    _Tab('/learn', Icons.school_outlined, Icons.school, 'Learn'),
    _Tab('/practice', Icons.quiz_outlined, Icons.quiz, 'Practice'),
    _Tab('/profile', Icons.person_outline, Icons.person, 'Profile'),
  ];

  int _indexForLocation(String location) {
    if (location.startsWith('/library')) return 1;
    if (location.startsWith('/learn')) return 2;
    if (location.startsWith('/practice')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final index = _indexForLocation(location);
    final hideNav = (location.contains('/library/') && location != '/library') ||
        location.contains('/practice/quiz/') ||
        location.contains('/practice/results/');

    return Scaffold(
      body: child,
      bottomNavigationBar: hideNav
          ? null
          : NavigationBar(
              selectedIndex: index,
              onDestinationSelected: (i) => context.go(_tabs[i].path),
              destinations: [
                for (final tab in _tabs)
                  NavigationDestination(
                    icon: Icon(tab.icon),
                    selectedIcon: Icon(tab.selectedIcon),
                    label: tab.label,
                  ),
              ],
            ),
    );
  }
}

class _Tab {
  const _Tab(this.path, this.icon, this.selectedIcon, this.label);

  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}
