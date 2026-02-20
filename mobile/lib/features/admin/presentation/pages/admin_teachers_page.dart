import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/widgets/search_filter_bar.dart';

class AdminTeachersPage extends ConsumerStatefulWidget {
  const AdminTeachersPage({super.key});

  @override
  ConsumerState<AdminTeachersPage> createState() => _AdminTeachersPageState();
}

class _AdminTeachersPageState extends ConsumerState<AdminTeachersPage> {
  List<dynamic> _teachers = [];
  List<dynamic> _filteredTeachers = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadTeachers();
  }

  Future<void> _loadTeachers() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/accounts/teachers/');
      setState(() {
        _teachers = response.data is List 
            ? response.data 
            : (response.data['results'] ?? []);
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredTeachers = _teachers.where((teacher) {
        if (_searchQuery.isNotEmpty) {
          final name = '${teacher['user']?['first_name'] ?? ''} ${teacher['user']?['last_name'] ?? ''}'.toLowerCase();
          return name.contains(_searchQuery.toLowerCase());
        }
        return true;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enseignants'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Créer un enseignant
            },
          ),
        ],
      ),
      body: Column(
        children: [
          SearchFilterBar(
            hintText: 'Rechercher un enseignant...',
            onSearchChanged: (value) {
              setState(() => _searchQuery = value);
              _applyFilters();
            },
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTeachers.isEmpty
                    ? const Center(child: Text('Aucun enseignant'))
                    : RefreshIndicator(
                        onRefresh: _loadTeachers,
                        child: ListView.builder(
                          itemCount: _filteredTeachers.length,
                          itemBuilder: (context, index) {
                            final teacher = _filteredTeachers[index];
                            final user = teacher['user'] ?? {};
                            final name = '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim();
                            
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              child: ListTile(
                                leading: const CircleAvatar(
                                  child: Icon(Icons.person),
                                ),
                                title: Text(name.isEmpty ? 'Enseignant' : name),
                                subtitle: Text(user['email'] ?? ''),
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
