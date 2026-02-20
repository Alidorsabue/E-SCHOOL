import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/widgets/search_filter_bar.dart';

class AdminElearningPage extends ConsumerStatefulWidget {
  const AdminElearningPage({super.key});

  @override
  ConsumerState<AdminElearningPage> createState() => _AdminElearningPageState();
}

class _AdminElearningPageState extends ConsumerState<AdminElearningPage> {
  List<dynamic> _courses = [];
  List<dynamic> _filteredCourses = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/elearning/courses/');
      
      final courses = response.data is List 
          ? response.data 
          : (response.data['results'] ?? []);
      
      setState(() {
        _courses = courses;
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredCourses = _courses.where((course) {
        if (_searchQuery.isNotEmpty) {
          final title = (course['title'] ?? '').toString().toLowerCase();
          final description = (course['description'] ?? '').toString().toLowerCase();
          if (!title.contains(_searchQuery.toLowerCase()) && 
              !description.contains(_searchQuery.toLowerCase())) {
            return false;
          }
        }
        return true;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('E-learning'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Créer un nouveau cours
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Fonctionnalité à venir')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          SearchFilterBar(
            hintText: 'Rechercher un cours...',
            onSearchChanged: (value) {
              setState(() => _searchQuery = value);
              _applyFilters();
            },
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredCourses.isEmpty
                    ? const Center(child: Text('Aucun cours trouvé'))
                    : RefreshIndicator(
                        onRefresh: _loadCourses,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredCourses.length,
                          itemBuilder: (context, index) {
                            final course = _filteredCourses[index];
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: Colors.blue,
                                  child: Icon(Icons.book, color: Colors.white),
                                ),
                                title: Text(course['title'] ?? 'Cours'),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (course['description'] != null)
                                      Text(
                                        course['description'],
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    if (course['subject'] != null)
                                      Text('Matière: ${course['subject']['name'] ?? ''}'),
                                    if (course['school_class'] != null)
                                      Text('Classe: ${course['school_class']['name'] ?? ''}'),
                                  ],
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  context.push('/courses/${course['id']}');
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
