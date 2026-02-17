import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../config/app_config.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();
  
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  static Future<void> init() async {
    final instance = NotificationService();
    await instance._initialize();
  }
  
  Future<void> _initialize() async {
    // Demander la permission
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Initialiser les notifications locales
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings();
      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );
      
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );
      
      // Créer le canal de notification Android
      const androidChannel = AndroidNotificationChannel(
        AppConfig.notificationChannelId,
        AppConfig.notificationChannelName,
        importance: Importance.high,
      );
      
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);
      
      // Écouter les messages en foreground
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Écouter les messages en background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
      
      // Obtenir le token FCM
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        // Envoyer le token au backend
        await _sendTokenToBackend(token);
      }
      
      // Écouter les changements de token
      _firebaseMessaging.onTokenRefresh.listen(_sendTokenToBackend);
    }
  }
  
  void _onNotificationTapped(NotificationResponse response) {
    // Gérer le tap sur la notification
    // Navigation vers l'écran approprié
  }
  
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    // Afficher une notification locale quand l'app est en foreground
    final notification = message.notification;
    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            AppConfig.notificationChannelId,
            AppConfig.notificationChannelName,
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(),
        ),
      );
    }
  }
  
  void _handleBackgroundMessage(RemoteMessage message) {
    // Gérer les messages en background
    // Navigation vers l'écran approprié
  }
  
  Future<void> _sendTokenToBackend(String token) async {
    // TODO: Envoyer le token au backend via API
    // await ApiService().post('/notifications/register-device/', data: {'token': token});
  }
  
  // Méthode statique pour le handler de background (doit être top-level)
  @pragma('vm:entry-point')
  static Future<void> backgroundMessageHandler(RemoteMessage message) async {
    // Traitement des messages en background
  }
}
