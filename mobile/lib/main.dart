import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

import 'core/database/hive_service.dart';
import 'core/database/database_service.dart';
import 'core/network/api_service.dart';
import 'core/network/connectivity_service.dart';
import 'core/services/sync_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/auth_provider.dart';
import 'core/config/app_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Orientations : portrait + paysage pour téléphone et tablette (iOS/Android)
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
    ),
  );

  // Afficher l'app tout de suite ; les init lourdes se font après le 1er frame
  runApp(
    const ProviderScope(
      child: AppInitializer(),
    ),
  );
}

/// Affiche un splash puis lance les initialisations en arrière-plan pour éviter
/// "Skipped N frames" (trop de travail sur le thread principal au démarrage).
class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _ready = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _performInit());
  }

  Future<void> _performInit() async {
    // 1) Initialisations essentielles : si échec → on affiche l'écran d'erreur
    try {
      print('🚀 [AppInitializer] Démarrage des initialisations...');
      await Hive.initFlutter();
      print('✅ [AppInitializer] Hive initialisé');
      
      final appDir = await getApplicationDocumentsDirectory();
      await DatabaseService.init(appDir.path);
      print('✅ [AppInitializer] Database initialisée');
      
      await HiveService.init();
      print('✅ [AppInitializer] HiveService initialisé');
      
      ApiService().init();
      print('✅ [AppInitializer] ApiService initialisé');
      print('🌐 [AppInitializer] URL API: ${AppConfig.baseUrl}');
      
      await ConnectivityService().init();
      print('✅ [AppInitializer] ConnectivityService initialisé');
    } catch (e, st) {
      debugPrint('❌ Erreur critique au démarrage: $e\n$st');
      if (mounted) setState(() => _error = e);
      return;
    }

    // 2) Services optionnels : jamais bloquants, on démarre l'app même si tout échoue
    try {
      await SyncService.init();
    } catch (e) {
      debugPrint('⚠️ SyncService non initialisé: $e');
    }

    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Text('Erreur au démarrage: $_error'),
            ),
          ),
        ),
      );
    }
    if (!_ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    return const ESchoolApp();
  }
}

class ESchoolApp extends ConsumerWidget {
  const ESchoolApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'E-School',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaleFactor: 1.0),
          child: child!,
        );
      },
    );
  }
}
