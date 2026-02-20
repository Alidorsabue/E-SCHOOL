import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/widgets/search_filter_bar.dart';

class TeacherQuizzesPage extends ConsumerStatefulWidget {
  const TeacherQuizzesPage({super.key});

  @override
  ConsumerState<TeacherQuizzesPage> createState() => _TeacherQuizzesPageState();
}

class _TeacherQuizzesPageState extends ConsumerState<TeacherQuizzesPage> {
  List<dynamic> _quizzes = [];
  List<dynamic> _filteredQuizzes = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String? _selectedSubject;
  String? _selectedClass;
  List<dynamic> _subjects = [];
  List<dynamic> _classes = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final [quizzesRes, subjectsRes, classesRes] = await Future.wait([
        ApiService().get('/api/elearning/quizzes/'),
        ApiService().get('/api/schools/subjects/'),
        ApiService().get('/api/schools/classes/'),
      ]);

      setState(() {
        _quizzes = quizzesRes.data is List 
            ? quizzesRes.data 
            : (quizzesRes.data['results'] ?? []);
        _subjects = subjectsRes.data is List 
            ? subjectsRes.data 
            : (subjectsRes.data['results'] ?? []);
        _classes = classesRes.data is List 
            ? classesRes.data 
            : (classesRes.data['results'] ?? []);
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredQuizzes = _quizzes.where((quiz) {
        if (_searchQuery.isNotEmpty) {
          final title = (quiz['title'] ?? '').toString().toLowerCase();
          if (!title.contains(_searchQuery.toLowerCase())) {
            return false;
          }
        }
        if (_selectedSubject != null) {
          if (quiz['subject']?['id'] != int.parse(_selectedSubject!)) {
            return false;
          }
        }
        if (_selectedClass != null) {
          if (quiz['school_class']?['id'] != int.parse(_selectedClass!)) {
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
        title: const Text('Quiz & Examens'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              context.push('/teacher/quizzes/create');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          SearchFilterBar(
            hintText: 'Rechercher un quiz...',
            onSearchChanged: (value) {
              setState(() => _searchQuery = value);
              _applyFilters();
            },
            filters: [
              FilterOption(
                key: 'subject',
                label: 'Matière',
                values: _subjects.map((s) => FilterValue(
                  value: s['id'].toString(),
                  label: s['name'] ?? 'Matière',
                )).toList(),
                selectedValue: _selectedSubject,
              ),
              FilterOption(
                key: 'class',
                label: 'Classe',
                values: _classes.map((c) => FilterValue(
                  value: c['id'].toString(),
                  label: c['name'] ?? 'Classe',
                )).toList(),
                selectedValue: _selectedClass,
              ),
            ],
            onFiltersChanged: (filters) {
              setState(() {
                _selectedSubject = filters['subject'];
                _selectedClass = filters['class'];
              });
              _applyFilters();
            },
            showSort: true,
            sortOptions: [
              SortOption(value: 'date_desc', label: 'Date (récent)'),
              SortOption(value: 'date_asc', label: 'Date (ancien)'),
              SortOption(value: 'title', label: 'Titre'),
            ],
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredQuizzes.isEmpty
                    ? const Center(child: Text('Aucun quiz'))
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          itemCount: _filteredQuizzes.length,
                          itemBuilder: (context, index) {
                            final quiz = _filteredQuizzes[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: ListTile(
                                leading: const Icon(Icons.quiz),
                                title: Text(quiz['title'] ?? 'Quiz'),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Classe: ${quiz['school_class']?['name'] ?? 'N/A'}'),
                                    Text('Matière: ${quiz['subject']?['name'] ?? 'N/A'}'),
                                    if (quiz['time_limit'] != null)
                                      Text('Durée: ${quiz['time_limit']} min'),
                                  ],
                                ),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  // TODO: Voir les détails
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
