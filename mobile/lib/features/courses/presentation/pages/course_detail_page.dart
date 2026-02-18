import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/database/database_service.dart';
import 'dart:io';

class CourseDetailPage extends ConsumerStatefulWidget {
  final int courseId;

  const CourseDetailPage({super.key, required this.courseId});

  @override
  ConsumerState<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends ConsumerState<CourseDetailPage> {
  Map<String, dynamic>? _course;
  bool _isLoading = true;
  bool _isDownloaded = false;
  bool _isDownloading = false;

  @override
  void initState() {
    super.initState();
    _loadCourse();
    _checkDownloadStatus();
  }

  Future<void> _loadCourse() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService().get('/api/elearning/courses/${widget.courseId}/');
      setState(() {
        _course = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _checkDownloadStatus() async {
    final db = DatabaseService.database;
    final result = await db.query(
      'downloaded_courses',
      where: 'course_id = ?',
      whereArgs: [widget.courseId],
    );

    setState(() {
      _isDownloaded = result.isNotEmpty;
    });
  }

  Future<void> _downloadCourse() async {
    if (_course == null) return;

    // Demander les permissions
    final status = await Permission.storage.request();
    if (!status.isGranted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Permission de stockage requise')),
        );
      }
      return;
    }

    setState(() {
      _isDownloading = true;
    });

    try {
      final appDir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${appDir.path}/downloads');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }

      // Télécharger le contenu du cours
      // TODO: Implémenter le téléchargement réel

      // Enregistrer dans la base de données
      final db = DatabaseService.database;
      await db.insert('downloaded_courses', {
        'course_id': widget.courseId,
        'title': _course!['title'],
        'description': _course!['description'],
        'content_path': downloadDir.path,
        'downloaded_at': DateTime.now().millisecondsSinceEpoch,
        'is_complete': 1,
      });

      setState(() {
        _isDownloaded = true;
        _isDownloading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cours téléchargé avec succès')),
        );
      }
    } catch (e) {
      setState(() {
        _isDownloading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur de téléchargement: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails du cours')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_course == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détails du cours')),
        body: const Center(child: Text('Cours non trouvé')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_course!['title'] ?? 'Cours'),
        actions: [
          IconButton(
            icon: _isDownloaded
                ? const Icon(Icons.check_circle)
                : const Icon(Icons.download),
            onPressed: _isDownloaded || _isDownloading ? null : _downloadCourse,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_course!['thumbnail'] != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  _course!['thumbnail'],
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            const SizedBox(height: 16),
            Text(
              _course!['title'] ?? 'Sans titre',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            if (_course!['description'] != null)
              Text(
                _course!['description'],
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                // TODO: Ouvrir le cours
              },
              icon: const Icon(Icons.play_arrow),
              label: const Text('Commencer le cours'),
            ),
          ],
        ),
      ),
    );
  }
}
