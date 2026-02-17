import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/database/hive_service.dart';

class CoursesPage extends ConsumerStatefulWidget {
  const CoursesPage({super.key});

  @override
  ConsumerState<CoursesPage> createState() => _CoursesPageState();
}

class _CoursesPageState extends ConsumerState<CoursesPage> {
  List<dynamic> _courses = [];
  bool _isLoading = true;
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses({bool useCache = true}) async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Essayer de charger depuis le cache d'abord
      if (useCache) {
        final cached = HiveService.getCachedData<List<dynamic>>('courses');
        if (cached != null) {
          setState(() {
            _courses = cached;
            _isLoading = false;
            _isOffline = true;
          });
        }
      }

      // Charger depuis l'API
      final response = await ApiService().get('/elearning/courses/', useCache: true);
      setState(() {
        _courses = response.data as List<dynamic>;
        _isLoading = false;
        _isOffline = false;
      });
    } catch (e) {
      // Si erreur et pas de cache, afficher message
      if (_courses.isEmpty) {
        setState(() {
          _isLoading = false;
          _isOffline = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Cours'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // TODO: Recherche
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _courses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.book_outlined,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _isOffline
                            ? 'Aucun cours disponible hors ligne'
                            : 'Aucun cours disponible',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => _loadCourses(useCache: false),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _courses.length,
                    itemBuilder: (context, index) {
                      final course = _courses[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: course['thumbnail'] != null
                              ? CachedNetworkImage(
                                  imageUrl: course['thumbnail'],
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => const CircularProgressIndicator(),
                                  errorWidget: (context, url, error) => const Icon(Icons.book),
                                )
                              : const Icon(Icons.book, size: 40),
                          title: Text(course['title'] ?? 'Sans titre'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (course['description'] != null)
                                Text(
                                  course['description'],
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.schedule, size: 16),
                                  const SizedBox(width: 4),
                                  Text('${course['duration'] ?? 0} min'),
                                ],
                              ),
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
    );
  }
}
