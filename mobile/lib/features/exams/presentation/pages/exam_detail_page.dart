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
      final response = await ApiService().get('/elearning/quizzes/${widget.examId}/');
      setState(() {
        _exam = response.data as Map<String, dynamic>;
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
      final response = await ApiService().post('/elearning/quiz-attempts/start/', data: {
        'quiz_id': widget.examId,
      });

      // TODO: Naviguer vers l'écran de l'examen
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Examen démarré')),
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
            const SizedBox(height: 24),
            if (canStart)
              ElevatedButton.icon(
                onPressed: _startExam,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Commencer l\'examen'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              )
            else
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
