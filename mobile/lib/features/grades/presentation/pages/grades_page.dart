import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/providers/auth_provider.dart';

class GradesPage extends ConsumerStatefulWidget {
  const GradesPage({super.key});

  @override
  ConsumerState<GradesPage> createState() => _GradesPageState();
}

class _GradesPageState extends ConsumerState<GradesPage> {
  List<dynamic> _children = [];
  int? _selectedChildId;
  List<dynamic> _grades = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = ref.read(authProvider).user;
    final isParent = user?.isParent ?? false;

    setState(() {
      _isLoading = true;
    });

    try {
      if (isParent) {
        // Pour les parents : charger les enfants d'abord
        await _loadChildren();
        if (_children.isNotEmpty && _selectedChildId == null) {
          _selectedChildId = _children.first['id'];
        }
      }
      await _loadGrades();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadChildren() async {
    try {
      // TODO: Charger les enfants depuis l'API
      // Pour l'instant, simuler avec une liste vide
      // final response = await ApiService().get('/auth/users/children/');
      setState(() {
        _children = []; // response.data as List<dynamic>;
      });
    } catch (e) {
      // Gérer l'erreur
    }
  }

  Future<void> _loadGrades() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final user = ref.read(authProvider).user;
      final isParent = user?.isParent ?? false;
      
      Map<String, dynamic>? queryParams;
      if (isParent && _selectedChildId != null) {
        queryParams = {'student': _selectedChildId};
      }

      final response = await ApiService().get(
        '/academics/grades/',
        queryParameters: queryParams,
      );
      
      setState(() {
        _grades = response.data as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Color _getGradeColor(double? score, double? maxScore) {
    if (score == null || maxScore == null) return Colors.grey;
    final percentage = (score / maxScore) * 100;
    if (percentage >= 80) return Colors.green;
    if (percentage >= 60) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isParent = user?.isParent ?? false;
    final isStudent = user?.isStudent ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(isParent ? 'Suivi Scolaire' : 'Mes Notes'),
      ),
      body: Column(
        children: [
          // Sélecteur d'enfant pour les parents
          if (isParent && _children.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<int>(
                value: _selectedChildId,
                decoration: const InputDecoration(
                  labelText: 'Sélectionner un enfant',
                  prefixIcon: Icon(Icons.person),
                ),
                items: _children.map((child) {
                  return DropdownMenuItem(
                    value: child['id'],
                    child: Text('${child['name']} - ${child['class'] ?? ''}'),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedChildId = value;
                  });
                  _loadGrades();
                },
              ),
            ),
          // Liste des notes
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _grades.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isParent ? Icons.school_outlined : Icons.grade_outlined,
                              size: 64,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              isParent
                                  ? 'Aucune note disponible pour cet enfant'
                                  : 'Aucune note disponible',
                              style: Theme.of(context).textTheme.bodyLarge,
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadGrades,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _grades.length,
                          itemBuilder: (context, index) {
                            final grade = _grades[index];
                            final score = grade['score']?.toDouble();
                            final maxScore = grade['max_score']?.toDouble();

                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: CircleAvatar(
                                  backgroundColor: _getGradeColor(score, maxScore),
                                  child: Text(
                                    score != null && maxScore != null
                                        ? '${((score / maxScore) * 100).toInt()}'
                                        : '?',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                title: Text(grade['course']?['name'] ?? 'Cours'),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (isParent && grade['student'] != null)
                                      Text('Élève: ${grade['student']['name'] ?? ''}'),
                                    if (grade['assignment'] != null)
                                      Text('Devoir: ${grade['assignment']['title']}'),
                                    if (grade['exam'] != null)
                                      Text('Examen: ${grade['exam']['title']}'),
                                    if (score != null && maxScore != null)
                                      Text('${score.toStringAsFixed(2)} / ${maxScore.toStringAsFixed(2)}'),
                                    if (grade['comment'] != null)
                                      Text(grade['comment']),
                                  ],
                                ),
                                trailing: grade['created_at'] != null
                                    ? Text(
                                        DateFormat('dd/MM/yyyy').format(
                                          DateTime.parse(grade['created_at']),
                                        ),
                                      )
                                    : null,
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
