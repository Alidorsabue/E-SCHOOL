import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../../../core/network/api_service.dart';
import '../../../../core/database/database_service.dart';

class BookReaderPage extends ConsumerStatefulWidget {
  final int bookId;
  final String? initialUrl;

  const BookReaderPage({
    super.key,
    required this.bookId,
    this.initialUrl,
  });

  @override
  ConsumerState<BookReaderPage> createState() => _BookReaderPageState();
}

class _BookReaderPageState extends ConsumerState<BookReaderPage> {
  PdfViewerController? _pdfViewerController;
  String? _pdfPath;
  bool _isLoading = true;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  int _currentPage = 1;
  int _totalPages = 0;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    _pdfViewerController = PdfViewerController();
    _loadPdf();
  }

  Future<void> _loadPdf() async {
    setState(() => _isLoading = true);

    try {
      // Vérifier si le PDF est déjà téléchargé
      final db = DatabaseService.database;
      final result = await db.query(
        'library_books',
        where: 'book_id = ?',
        whereArgs: [widget.bookId],
      );

      if (result.isNotEmpty && result.first['file_path'] != null) {
        final filePath = result.first['file_path'] as String;
        final file = File(filePath);
        if (await file.exists()) {
          setState(() {
            _pdfPath = filePath;
            _isLoading = false;
          });
          return;
        }
      }

      // Télécharger le PDF
      await _downloadPdf();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _downloadPdf() async {
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });

    try {
      // Obtenir l'URL du PDF
      final bookResponse = await ApiService().get('/api/library/books/${widget.bookId}/');
      final book = bookResponse.data as Map<String, dynamic>;
      final pdfUrl = widget.initialUrl ?? book['file_url'] ?? book['pdf_url'];

      if (pdfUrl == null) {
        throw Exception('URL du PDF non disponible');
      }

      // Télécharger le fichier
      final appDir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${appDir.path}/downloads/books');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }

      final fileName = pdfUrl.split('/').last;
      final filePath = '${downloadDir.path}/$fileName';

      final dio = Dio();
      await dio.download(
        pdfUrl,
        filePath,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            setState(() {
              _downloadProgress = received / total;
            });
          }
        },
      );

      // Enregistrer dans la base de données
      final db = DatabaseService.database;
      await db.insert('library_books', {
        'book_id': widget.bookId,
        'title': book['title'],
        'author': book['author'],
        'description': book['description'],
        'cover_url': book['cover_url'],
        'file_path': filePath,
        'is_downloaded': 1,
        'progress': 1.0,
        'created_at': DateTime.now().millisecondsSinceEpoch,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      });

      setState(() {
        _pdfPath = filePath;
        _isDownloading = false;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isDownloading = false;
        _isLoading = false;
      });
      rethrow;
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
  }

  void _goToPage(int page) {
    _pdfViewerController?.jumpToPage(page);
  }

  void _nextPage() {
    if (_currentPage < _totalPages) {
      _pdfViewerController?.nextPage();
    }
  }

  void _previousPage() {
    if (_currentPage > 1) {
      _pdfViewerController?.previousPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _showControls
          ? AppBar(
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Lecteur PDF'),
                  if (_totalPages > 0)
                    Text(
                      'Page $_currentPage sur $_totalPages',
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: () {
                    // TODO: Recherche dans le PDF
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.bookmark),
                  onPressed: () {
                    // TODO: Ajouter un signet
                  },
                ),
              ],
            )
          : null,
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isDownloading) ...[
                    CircularProgressIndicator(value: _downloadProgress),
                    const SizedBox(height: 16),
                    Text('Téléchargement: ${(_downloadProgress * 100).toStringAsFixed(0)}%'),
                  ] else
                    const CircularProgressIndicator(),
                ],
              ),
            )
          : _pdfPath == null
              ? const Center(child: Text('PDF non disponible'))
              : GestureDetector(
                  onTap: _toggleControls,
                  child: Stack(
                    children: [
                      // Lecteur PDF
                      SfPdfViewer.file(
                        File(_pdfPath!),
                        controller: _pdfViewerController,
                        onDocumentLoaded: (details) {
                          setState(() {
                            _totalPages = details.document.pages.count;
                          });
                        },
                        onPageChanged: (details) {
                          setState(() {
                            _currentPage = details.newPageNumber;
                          });
                        },
                      ),
                      // Contrôles
                      if (_showControls)
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.7),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, -2),
                                ),
                              ],
                            ),
                            child: SafeArea(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Barre de progression
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.first_page, color: Colors.white),
                                          onPressed: _currentPage == 1 ? null : () => _goToPage(1),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_left, color: Colors.white),
                                          onPressed: _currentPage == 1 ? null : _previousPage,
                                        ),
                                        Expanded(
                                          child: Slider(
                                            value: _currentPage.toDouble(),
                                            min: 1,
                                            max: _totalPages.toDouble(),
                                            divisions: _totalPages,
                                            label: 'Page $_currentPage',
                                            onChanged: (value) {
                                              _goToPage(value.toInt());
                                            },
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.chevron_right, color: Colors.white),
                                          onPressed: _currentPage == _totalPages ? null : _nextPage,
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.last_page, color: Colors.white),
                                          onPressed: _currentPage == _totalPages ? null : () => _goToPage(_totalPages),
                                        ),
                                      ],
                                    ),
                                    // Informations
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        TextButton.icon(
                                          icon: const Icon(Icons.zoom_in, color: Colors.white),
                                          label: const Text('Zoom', style: TextStyle(color: Colors.white)),
                                          onPressed: () {
                                            // TODO: Zoom
                                          },
                                        ),
                                        TextButton.icon(
                                          icon: const Icon(Icons.fullscreen, color: Colors.white),
                                          label: const Text('Plein écran', style: TextStyle(color: Colors.white)),
                                          onPressed: () {
                                            // TODO: Plein écran
                                          },
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
      floatingActionButton: _showControls
          ? FloatingActionButton(
              onPressed: _toggleControls,
              child: const Icon(Icons.visibility_off),
            )
          : FloatingActionButton(
              onPressed: _toggleControls,
              child: const Icon(Icons.visibility),
            ),
    );
  }
}
