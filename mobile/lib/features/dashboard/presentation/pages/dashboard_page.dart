import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/network/api_service.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  List<dynamic> _childrenDashboard = [];
  bool _childrenLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChildrenIfParent();
  }

  Future<void> _loadChildrenIfParent() async {
    final user = ref.read(authProvider).user;
    if (user?.isParent != true) return;
    setState(() => _childrenLoading = true);
    try {
      final api = ApiService();
      final response = await api.get(
        '/api/auth/students/parent_dashboard/',
        useCache: false,
      );
      final data = response.data;
      final list = data is List
          ? data
          : (data is Map && data['results'] != null
              ? data['results'] as List
              : <dynamic>[]);
      if (mounted) {
        setState(() {
          _childrenDashboard = list is List<dynamic> ? list : List<dynamic>.from(list);
          _childrenLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _childrenDashboard = []; _childrenLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isStudent = user?.role == 'STUDENT';
    final isParent = user?.role == 'PARENT';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tableau de bord'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Ouvrir les notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              context.push('/profile');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(authProvider.notifier).refreshUser();
          await _loadChildrenIfParent();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Bienvenue
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bonjour,',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.fullName ?? (isStudent ? 'Élève' : 'Parent'),
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      if (isStudent && user?.studentId != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Matricule: ${user!.studentId}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Contenu selon le rôle
              if (isStudent) ...[
                // Dashboard Élève
                Text(
                  'Actions rapides',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.2,
                  children: [
                    _DashboardCard(
                      icon: Icons.book,
                      title: 'Mes Cours',
                      color: Colors.blue,
                      onTap: () => context.push('/courses'),
                    ),
                    _DashboardCard(
                      icon: Icons.assignment,
                      title: 'Devoirs',
                      color: Colors.orange,
                      onTap: () => context.push('/assignments'),
                    ),
                    _DashboardCard(
                      icon: Icons.quiz,
                      title: 'Examens',
                      color: Colors.red,
                      onTap: () => context.push('/exams'),
                    ),
                    _DashboardCard(
                      icon: Icons.library_books,
                      title: 'Bibliothèque',
                      color: Colors.green,
                      onTap: () => context.push('/library'),
                    ),
                    _DashboardCard(
                      icon: Icons.grade,
                      title: 'Notes',
                      color: Colors.purple,
                      onTap: () => context.push('/grades'),
                    ),
                    _DashboardCard(
                      icon: Icons.gavel,
                      title: 'Fiches de discipline',
                      color: Colors.brown,
                      onTap: () => context.push('/discipline'),
                    ),
                    _DashboardCard(
                      icon: Icons.message,
                      title: 'Communication',
                      color: Colors.teal,
                      onTap: () => context.push('/communication'),
                    ),
                  ],
                ),
              ] else if (isParent) ...[
                // Dashboard Parent
                Text(
                  'Mes Enfants',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                if (_childrenLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                else if (_childrenDashboard.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'Aucun enfant inscrit',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  )
                else
                  ...(_childrenDashboard.map<Widget>((item) {
                    final identity = item is Map ? (item['identity'] as Map?) ?? item : <String, dynamic>{};
                    final userData = identity['user'];
                    final userName = userData is Map
                        ? '${userData['first_name'] ?? ''} ${userData['last_name'] ?? ''}'.trim()
                        : (identity['user_name'] as String? ?? '');
                    final className = identity['class_name'] as String? ?? identity['school_class_academic_year'] as String? ?? '';
                    final studentId = identity['id'];
                    return Card(
                      child: ListTile(
                        leading: const CircleAvatar(
                          child: Icon(Icons.person),
                        ),
                        title: Text(userName.isEmpty ? 'Enfant' : userName),
                        subtitle: Text(className.isEmpty ? 'Classe' : className),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          if (studentId != null) context.push('/students/$studentId');
                        },
                      ),
                    );
                  })),
                const SizedBox(height: 24),
                // Modules alignés avec le web (ordre = sidebar parent)
                Text(
                  'Modules',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.2,
                  children: [
                    _DashboardCard(
                      icon: Icons.grade,
                      title: 'Notes',
                      color: Colors.orange,
                      onTap: () => context.push('/grades'),
                    ),
                    _DashboardCard(
                      icon: Icons.event,
                      title: 'Réunions',
                      color: Colors.green,
                      onTap: () => context.push('/meetings'),
                    ),
                    _DashboardCard(
                      icon: Icons.payment,
                      title: 'Paiements',
                      color: Colors.purple,
                      onTap: () => context.push('/payments'),
                    ),
                    _DashboardCard(
                      icon: Icons.library_books,
                      title: 'Bibliothèque',
                      color: Colors.indigo,
                      onTap: () => context.push('/library'),
                    ),
                    _DashboardCard(
                      icon: Icons.school,
                      title: 'Encadrement',
                      color: Colors.teal,
                      onTap: () => context.push('/tutoring'),
                    ),
                    _DashboardCard(
                      icon: Icons.gavel,
                      title: 'Fiches de discipline',
                      color: Colors.brown,
                      onTap: () => context.push('/discipline'),
                    ),
                    _DashboardCard(
                      icon: Icons.message,
                      title: 'Communication',
                      color: Colors.cyan,
                      onTap: () => context.push('/communication'),
                    ),
                    _DashboardCard(
                      icon: Icons.person_add,
                      title: 'Inscription',
                      color: Colors.blue,
                      onTap: () => context.push('/enrollment'),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(context, isStudent, isParent),
    );
  }

  Widget? _buildBottomNavigationBar(BuildContext context, bool isStudent, bool isParent) {
    if (isStudent) {
      return NavigationBar(
        selectedIndex: 0,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.push('/courses');
              break;
            case 2:
              context.push('/assignments');
              break;
            case 3:
              context.push('/library');
              break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.book), label: 'Cours'),
          NavigationDestination(icon: Icon(Icons.assignment), label: 'Devoirs'),
          NavigationDestination(icon: Icon(Icons.library_books), label: 'Bibliothèque'),
        ],
      );
    } else if (isParent) {
      return NavigationBar(
        selectedIndex: 0,
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.push('/grades');
              break;
            case 2:
              context.push('/meetings');
              break;
            case 3:
              context.push('/payments');
              break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.grade), label: 'Notes'),
          NavigationDestination(icon: Icon(Icons.event), label: 'Réunions'),
          NavigationDestination(icon: Icon(Icons.payment), label: 'Paiements'),
        ],
      );
    }
    return null;
  }
}

class _DashboardCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _DashboardCard({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
