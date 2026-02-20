import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/widgets/search_filter_bar.dart';
import 'parent_tutoring_page.dart';

class TutoringPage extends ConsumerStatefulWidget {
  const TutoringPage({super.key});

  @override
  ConsumerState<TutoringPage> createState() => _TutoringPageState();
}

class _TutoringPageState extends ConsumerState<TutoringPage> {
  List<dynamic> _tutoringSessions = [];
  List<dynamic> _filteredSessions = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadTutoringSessions();
  }

  Future<void> _loadTutoringSessions() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService().get('/api/tutoring/sessions/');
      setState(() {
        _tutoringSessions = response.data is List<dynamic>
            ? response.data
            : (response.data['results'] ?? []);
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredSessions = _tutoringSessions.where((session) {
        if (_searchQuery.isNotEmpty) {
          final subject = (session['subject'] ?? '').toString().toLowerCase();
          final notes = (session['notes'] ?? '').toString().toLowerCase();
          return subject.contains(_searchQuery.toLowerCase()) ||
              notes.contains(_searchQuery.toLowerCase());
        }
        return true;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isParent = user?.isParent ?? false;
    
    // Si parent, utiliser la page dédiée avec messages et rapports
    if (isParent) {
      return const ParentTutoringPage();
    }
    
    // Sinon, page normale pour enseignants
    return Scaffold(
      appBar: AppBar(
        title: const Text('Encadrement Domicile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Créer une nouvelle session d'encadrement
            },
          ),
        ],
      ),
      body: Column(
        children: [
          SearchFilterBar(
            hintText: 'Rechercher une session...',
            onSearchChanged: (value) {
              setState(() => _searchQuery = value);
              _applyFilters();
            },
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredSessions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.school_outlined,
                              size: 64,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Aucune session d\'encadrement',
                              style: Theme.of(context).textTheme.bodyLarge,
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadTutoringSessions,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredSessions.length,
                          itemBuilder: (context, index) {
                            final session = _filteredSessions[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: const CircleAvatar(
                            backgroundColor: Colors.teal,
                            child: Icon(Icons.school, color: Colors.white),
                          ),
                          title: Text(session['subject'] ?? 'Matière'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (session['student'] != null)
                                Text('Élève: ${session['student']['name']}'),
                              if (session['date'] != null)
                                Text('Date: ${session['date']}'),
                              if (session['notes'] != null)
                                Text(
                                  session['notes'],
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            // TODO: Voir les détails de la session
                          },
                        ),
                      );
                            },
                          ),
                        ),
                      ),
        ],
      ),
    );
  }
}
