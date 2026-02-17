class AppConfig {
  // API Configuration
  static const String baseUrl = 'http://localhost:8000/api';
  static const String apiVersion = 'v1';
  static const Duration apiTimeout = Duration(seconds: 30);
  
  // Cache Configuration
  static const Duration cacheExpiration = Duration(hours: 24);
  static const int maxCacheSize = 100 * 1024 * 1024; // 100 MB
  
  // Offline Configuration
  static const Duration syncInterval = Duration(minutes: 15);
  static const int maxRetryAttempts = 3;
  static const Duration retryDelay = Duration(seconds: 5);
  
  // Download Configuration
  static const String downloadPath = 'downloads';
  static const int maxConcurrentDownloads = 3;
  
  // Security
  static const String encryptionKey = 'eschool_mobile_key'; // À changer en production
  static const int tokenRefreshThreshold = 300; // 5 minutes avant expiration
  
  // UI Configuration
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;
  static const Duration animationDuration = Duration(milliseconds: 300);
  
  // Data Optimization
  static const bool enableImageCompression = true;
  static const int imageQuality = 80;
  static const int thumbnailSize = 200;
  
  // Notification Configuration
  static const String notificationChannelId = 'eschool_channel';
  static const String notificationChannelName = 'E-School Notifications';
}
