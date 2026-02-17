import 'package:hive_flutter/hive_flutter.dart';

class HiveService {
  static const String _cacheBoxName = 'cache';
  static const String _settingsBoxName = 'settings';
  
  static late Box _cacheBox;
  static late Box _settingsBox;
  
  static Future<void> init() async {
    _cacheBox = await Hive.openBox(_cacheBoxName);
    _settingsBox = await Hive.openBox(_settingsBoxName);
  }
  
  // Cache Operations
  static Future<void> cacheData(String key, dynamic value, {Duration? expiration}) async {
    final data = {
      'value': value,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'expiration': expiration?.inMilliseconds,
    };
    await _cacheBox.put(key, data);
  }
  
  static T? getCachedData<T>(String key) {
    final data = _cacheBox.get(key);
    if (data == null) return null;
    
    final timestamp = data['timestamp'] as int;
    final expiration = data['expiration'] as int?;
    
    if (expiration != null) {
      final now = DateTime.now().millisecondsSinceEpoch;
      if (now - timestamp > expiration) {
        _cacheBox.delete(key);
        return null;
      }
    }
    
    return data['value'] as T?;
  }
  
  static Future<void> clearCache() async {
    await _cacheBox.clear();
  }
  
  static Future<void> removeCache(String key) async {
    await _cacheBox.delete(key);
  }
  
  // Settings Operations
  static Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox.put(key, value);
  }
  
  static T? getSetting<T>(String key, {T? defaultValue}) {
    return _settingsBox.get(key, defaultValue: defaultValue) as T?;
  }
  
  static Future<void> clearSettings() async {
    await _settingsBox.clear();
  }
  
  // Cleanup expired cache
  static Future<void> cleanupExpiredCache() async {
    final keys = _cacheBox.keys.toList();
    final now = DateTime.now().millisecondsSinceEpoch;
    
    for (final key in keys) {
      final data = _cacheBox.get(key);
      if (data != null) {
        final timestamp = data['timestamp'] as int;
        final expiration = data['expiration'] as int?;
        
        if (expiration != null && now - timestamp > expiration) {
          await _cacheBox.delete(key);
        }
      }
    }
  }
}
