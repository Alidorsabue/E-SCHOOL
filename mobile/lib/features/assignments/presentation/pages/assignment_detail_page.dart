import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/services/sync_service.dart';
import '../../../../core/database/database_service.dart';

class AssignmentDetailPage extends ConsumerStatefulWidget {
  final int assignmentId;

  const AssignmentDetailPage({super.key, required this.assignmentId});

  @override
  ConsumerState<AssignmentDetailPage> createState() => _AssignmentDetailPageState();
}

class _AssignmentDetailPageState extends ConsumerState<AssignmentDetailPage> {
  Map<String, dynamic>? _assignment;
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadAssignment();
  }

  Future<void> _loadAssignment() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService().get('/elearning/assignments/${widget.assignmentId}/');
      setState(() {
        _assignment = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _submitAssignment() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.any,
    );

    if (result == null) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Enregistrer dans la queue de synchronisation
      await SyncService.addToSyncQueue(
        'assignments',
        widget.assignmentId,
        'submit',
        {
          'id': widget.assignmentId,
          'file_path': result.files.single.path,
        },
      );

      // Mettre à jour localement
      final db = DatabaseService.database;
      await db.update(
        'assignments',
        {
          'status': 'submitted',
          'submitted_at': DateTime.now().millisecondsSinceEpoch,
        },
        where: 'assignment_id = ?',
        whereArgs: [widget.assignmentId],
      );

      // Essayer de synchroniser immédiatement
      await SyncService.syncPendingData();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Devoir soumis avec succès')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails du devoir')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_assignment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails du devoir')),
        body: const Center(child: Text('Devoir non trouvé')),
      );
    }

    final dueDate = _assignment!['due_date'] != null
        ? DateTime.parse(_assignment!['due_date'])
        : null;
    final status = _assignment!['status'] ?? 'pending';
    final canSubmit = status != 'submitted' && dueDate != null && DateTime.now().isBefore(dueDate);

    return Scaffold(
      appBar: AppBar(
        title: Text(_assignment!['title'] ?? 'Devoir'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _assignment!['title'] ?? 'Sans titre',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            if (_assignment!['description'] != null)
              Text(
                _assignment!['description'],
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Statut:'),
                        Chip(
                          label: Text(status.toUpperCase()),
                          backgroundColor: status == 'submitted'
                              ? Colors.green
                              : status == 'overdue'
                                  ? Colors.red
                                  : Colors.orange,
                        ),
                      ],
                    ),
                    if (dueDate != null) ...[
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Date d\'échéance:'),
                          Text(DateFormat('dd/MM/yyyy HH:mm').format(dueDate)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (canSubmit)
              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitAssignment,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.upload),
                label: Text(_isSubmitting ? 'Soumission...' : 'Soumettre le devoir'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
