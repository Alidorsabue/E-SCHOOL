import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/providers/auth_provider.dart';

/// Fiches de discipline — synchronisé avec le web (Parent : enfants ; Élève : ses fiches).
class DisciplinePage extends ConsumerStatefulWidget {
  const DisciplinePage({super.key});

  @override
  ConsumerState<DisciplinePage> createState() => _DisciplinePageState();
}

class _DisciplinePageState extends ConsumerState<DisciplinePage> {
  List<dynamic> _records = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRecords();
  }

  Future<void> _loadRecords() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      final response = await api.get<dynamic>(
        '/api/academics/discipline/',
        useCache: false,
      );
      final data = response.data;
      final list = data is List
          ? data
          : (data is Map && data['results'] != null)
              ? (data['results'] as List)
              : <dynamic>[];
      final records = list is List<dynamic> ? list : List<dynamic>.from(list);
      if (mounted) {
        setState(() {
          _records = records;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() { _records = []; _isLoading = false; });
    }
  }

  Color _severityColor(String? s) {
    switch (s?.toUpperCase()) {
      case 'HIGH': return Colors.red;
      case 'MEDIUM': return Colors.orange;
      case 'LOW': return Colors.amber;
      default: return Colors.grey;
    }
  }

  Color _statusColor(String? s) {
    switch (s?.toUpperCase()) {
      case 'OPEN': return Colors.orange;
      case 'RESOLVED': return Colors.green;
      case 'CLOSED': return Colors.grey;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isParent = user?.isParent ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fiches de discipline'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _records.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.gavel_outlined, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        isParent ? 'Aucune fiche pour vos enfants' : 'Aucune fiche de discipline',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadRecords,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _records.length,
                    itemBuilder: (context, index) {
                      final r = _records[index] as Map? ?? {};
                      final type = r['type']?.toString() ?? '';
                      final severity = r['severity']?.toString() ?? '';
                      final status = r['status']?.toString() ?? '';
                      final dateStr = r['date'] ?? r['created_at'];
                      final description = r['description']?.toString() ?? '';
                      final studentName = r['student_name']?.toString() ?? '';
                      final className = r['class_name']?.toString() ?? '';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: CircleAvatar(
                            backgroundColor: _severityColor(severity),
                            child: Icon(
                              type.toUpperCase() == 'POSITIVE' ? Icons.thumb_up : Icons.gavel,
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            isParent ? studentName : (description.isNotEmpty ? description : 'Fiche #${r['id']}'),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (isParent && className.isNotEmpty) Text('$className'),
                              if (dateStr != null) Text(DateFormat('dd/MM/yyyy').format(DateTime.tryParse(dateStr.toString()) ?? DateTime.now())),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(status, style: TextStyle(fontSize: 12, color: _statusColor(status))),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(severity, style: TextStyle(fontSize: 12, color: _severityColor(severity))),
                                ],
                              ),
                            ],
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
