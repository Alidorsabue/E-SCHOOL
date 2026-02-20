import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  static const String _keyTheme = 'theme';
  static const String _keyLanguage = 'language';
  static const String _keyNotifications = 'notifications_enabled';
  static const String _keyOfflineMode = 'offline_mode';
  static const String _keyAutoSync = 'auto_sync';
  static const String _keyFontSize = 'font_size';

  static Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  // Theme
  static Future<String?> getTheme() async {
    final prefs = await _prefs;
    return prefs.getString(_keyTheme) ?? 'system';
  }

  static Future<void> setTheme(String theme) async {
    final prefs = await _prefs;
    await prefs.setString(_keyTheme, theme);
  }

  // Language
  static Future<String?> getLanguage() async {
    final prefs = await _prefs;
    return prefs.getString(_keyLanguage) ?? 'fr';
  }

  static Future<void> setLanguage(String language) async {
    final prefs = await _prefs;
    await prefs.setString(_keyLanguage, language);
  }

  // Notifications
  static Future<bool> getNotificationsEnabled() async {
    final prefs = await _prefs;
    return prefs.getBool(_keyNotifications) ?? true;
  }

  static Future<void> setNotificationsEnabled(bool enabled) async {
    final prefs = await _prefs;
    await prefs.setBool(_keyNotifications, enabled);
  }

  // Offline Mode
  static Future<bool> getOfflineMode() async {
    final prefs = await _prefs;
    return prefs.getBool(_keyOfflineMode) ?? false;
  }

  static Future<void> setOfflineMode(bool enabled) async {
    final prefs = await _prefs;
    await prefs.setBool(_keyOfflineMode, enabled);
  }

  // Auto Sync
  static Future<bool> getAutoSync() async {
    final prefs = await _prefs;
    return prefs.getBool(_keyAutoSync) ?? true;
  }

  static Future<void> setAutoSync(bool enabled) async {
    final prefs = await _prefs;
    await prefs.setBool(_keyAutoSync, enabled);
  }

  // Font Size
  static Future<double> getFontSize() async {
    final prefs = await _prefs;
    return prefs.getDouble(_keyFontSize) ?? 14.0;
  }

  static Future<void> setFontSize(double size) async {
    final prefs = await _prefs;
    await prefs.setDouble(_keyFontSize, size);
  }

  // Clear all preferences
  static Future<void> clearAll() async {
    final prefs = await _prefs;
    await prefs.clear();
  }
}
