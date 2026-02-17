import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

import 'core/config/app_config.dart';
import 'core/database/hive_service.dart';
import 'core/database/database_service.dart';
import 'core/network/api_service.dart';
import 'core/network/connectivity_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/sync_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialiser Hive pour le cache local
  await Hive.initFlutter();
  
  // Initialiser la base de données locale
  final appDir = await getApplicationDocumentsDirectory();
  await DatabaseService.init(appDir.path);
  
  // Initialiser Hive Service
  await HiveService.init();
  
  // Initialiser les services réseau
  ApiService().init();
  await ConnectivityService().init();
  
  // Initialiser Firebase
  await Firebase.initializeApp();
  
  // Initialiser les services
  await NotificationService.init();
  await SyncService.init();
  
  // Configuration système
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Mode plein écran pour Android
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  
  runApp(
    const ProviderScope(
      child: ESchoolApp(),
    ),
  );
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
