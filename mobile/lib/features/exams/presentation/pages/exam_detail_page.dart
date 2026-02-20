import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_service.dart';

class ExamDetailPage extends ConsumerStatefulWidget {
  final int examId;

  const ExamDetailPage({super.key, required this.examId});

  @override
  ConsumerState<ExamDetailPage> createState() => _ExamDetailPageState();
}

class _ExamDetailPageState extends ConsumerState<ExamDetailPage> {
  Map<String, dynamic>? _exam;
  List<dynamic> _attempts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadExam();
  }

  Future<void> _loadExam() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final [examRes, attemptsRes] = await Future.wait([
        ApiService().get('/api/elearning/quizzes/${widget.examId}/'),
        ApiService().get('/api/elearning/quiz-attempts/', queryParameters: {
          'quiz': widget.examId,
        }),
      ]);
      
      setState(() {
        _exam = examRes.data as Map<String, dynamic>;
        _attempts = attemptsRes.data is List 
            ? attemptsRes.data 
            : (attemptsRes.data['results'] ?? []);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _startExam() async {
    try {
      final response = await ApiService().post('/api/elearning/quiz-attempts/start/', data: {
        'quiz': widget.examId,
      });

      final attemptId = response.data['id'] as int?;
      if (attemptId != null && mounted) {
        context.push('/exams/${widget.examId}/take/$attemptId');
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur: ID de tentative non reçu')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails de l\'examen')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_exam == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails de l\'examen')),
        body: const Center(child: Text('Examen non trouvé')),
      );
    }

    final startDate = _exam!['start_date'] != null
        ? DateTime.parse(_exam!['start_date'])
        : null;
    final endDate = _exam!['end_date'] != null
        ? DateTime.parse(_exam!['end_date'])
        : null;
    final canStart = startDate != null &&
        DateTime.now().isAfter(startDate) &&
        (endDate == null || DateTime.now().isBefore(endDate));

    return Scaffold(
      appBar: AppBar(
        title: Text(_exam!['title'] ?? 'Examen'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _exam!['title'] ?? 'Sans titre',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            if (_exam!['description'] != null)
              Text(
                _exam!['description'],
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (startDate != null) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Date de début:'),
                          Text(DateFormat('dd/MM/yyyy HH:mm').format(startDate)),
                        ],
                      ),
                      const Divider(),
                    ],
                    if (endDate != null) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Date de fin:'),
                          Text(DateFormat('dd/MM/yyyy HH:mm').format(endDate)),
                        ],
                      ),
                      const Divider(),
                    ],
                    if (_exam!['duration'] != null)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Durée:'),
                          Text('${_exam!['duration']} minutes'),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            // Afficher les scores des tentatives
            if (_attempts.isNotEmpty) ...[
              const SizedBox(height: 24),
              Card(
                color: Colors.blue.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.quiz, color: Colors.blue),
                          const SizedBox(width: 8),
                          Text(
                            'Mes tentatives',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ..._attempts.map((attempt) {
                        final score = attempt['score']?.toDouble();
                        final maxPoints = attempt['total_points']?.toDouble() ?? _exam!['total_points']?.toDouble() ?? 20;
                        final isCompleted = attempt['completed_at'] != null;
                        
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isCompleted ? 'Tentative complétée' : 'Tentative en cours',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                  if (attempt['completed_at'] != null)
                                    Text(
                                      DateFormat('dd/MM/yyyy HH:mm').format(
                                        DateTime.parse(attempt['completed_at']),
                                      ),
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                ],
                              ),
                              if (score != null)
                                Text(
                                  '$score / $maxPoints',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                ),
                            ],
                          ),
                        );
                      }),
                      if (_attempts.isNotEmpty && _attempts.any((a) => a['score'] != null)) ...[
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Meilleure tentative:'),
                            Text(
                              '${_attempts.where((a) => a['score'] != null).map((a) => a['score'] as num).reduce((a, b) => a > b ? a : b)} / ${_attempts.first['total_points']?.toDouble() ?? _exam!['total_points']?.toDouble() ?? 20}',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            if (canStart && (_exam!['allow_multiple_attempts'] == true || _attempts.isEmpty))
              ElevatedButton.icon(
                onPressed: _startExam,
                icon: const Icon(Icons.play_arrow),
                label: Text(_attempts.isNotEmpty ? 'Reprendre l\'examen' : 'Commencer l\'examen'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              )
            else if (!canStart)
              Card(
                color: Colors.orange.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.info, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          startDate != null && DateTime.now().isBefore(startDate)
                              ? 'L\'examen n\'a pas encore commencé'
                              : 'L\'examen est terminé',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
