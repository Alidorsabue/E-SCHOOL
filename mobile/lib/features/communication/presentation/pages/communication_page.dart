import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_service.dart';

/// Communication — annonces et messages (synchronisé avec le web).
class CommunicationPage extends ConsumerStatefulWidget {
  const CommunicationPage({super.key});

  @override
  ConsumerState<CommunicationPage> createState() => _CommunicationPageState();
}

class _CommunicationPageState extends ConsumerState<CommunicationPage> with SingleTickerProviderStateMixin {
  List<dynamic> _announcements = [];
  List<dynamic> _messages = [];
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _short(String s, int maxLen) {
    if (s.length <= maxLen) return s;
    return '${s.substring(0, maxLen)}...';
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      final results = await Future.wait([
        api.get<dynamic>('/api/communication/announcements/', useCache: false),
        api.get<dynamic>('/api/communication/messages/', useCache: false),
        api.get<dynamic>('/api/communication/notifications/', useCache: false),
      ]);
      List<dynamic> list(dynamic data) {
        if (data is List) return data;
        if (data is Map && data['results'] != null) return data['results'] as List;
        return [];
      }
      if (mounted) {
        setState(() {
          _announcements = list(results[0].data);
          _messages = list(results[1].data);
          _notifications = list(results[2].data);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() {
        _announcements = [];
        _messages = [];
        _notifications = [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Communication'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Annonces', icon: Icon(Icons.campaign)),
            Tab(text: 'Messages', icon: Icon(Icons.mail)),
            Tab(text: 'Notifications', icon: Icon(Icons.notifications)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _listView('Annonces', _announcements, (a) {
                  final title = a['title'] ?? a['message'] ?? 'Sans titre';
                  final message = a['message'] ?? a['title'] ?? '';
                  final createdAt = a['created_at'] ?? a['published_at'];
                  return ListTile(
                    title: Text(title.toString()),
                    subtitle: Text('${message.toString().length > 80 ? '${message.toString().substring(0, 80)}...' : message}\n${createdAt != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.tryParse(createdAt.toString()) ?? DateTime.now()) : ''}'),
                    isThreeLine: true,
                  );
                }),
                _listView('Messages', _messages, (m) {
                  final subject = m['subject'] ?? 'Sans objet';
                  final created = m['created_at'];
                  return ListTile(
                    title: Text(subject.toString()),
                    subtitle: Text(created != null ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.tryParse(created.toString()) ?? DateTime.now()) : ''),
                    leading: CircleAvatar(child: Icon(m['is_read'] == true ? Icons.drafts : Icons.mail)),
                  );
                }),
                _listView('Notifications', _notifications, (n) {
                  final title = n['title'] ?? n['notification_type'] ?? 'Notification';
                  final message = n['message'] ?? '';
                  final createdAt = n['created_at'];
                  return ListTile(
                    leading: CircleAvatar(child: Icon(n['is_read'] == true ? Icons.notifications_none : Icons.notifications)),
                    title: Text(title.toString()),
                    subtitle: Text('${_short(message.toString(), 60)}\n${createdAt != null ? DateFormat('dd/MM/yyyy').format(DateTime.tryParse(createdAt.toString()) ?? DateTime.now()) : ''}'),
                    isThreeLine: true,
                  );
                }),
              ],
            ),
    );
  }

  Widget _listView(String emptyLabel, List<dynamic> items, Widget Function(dynamic) itemBuilder) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('Aucun $emptyLabel', style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final item = items[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: itemBuilder(item),
          );
        },
      ),
    );
  }
}
