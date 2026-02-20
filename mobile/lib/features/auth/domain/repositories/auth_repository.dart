import '../models/user_model.dart';
import '../../../../core/network/api_service.dart';
import '../../../../core/config/app_config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LoginResult {
  final String accessToken;
  final String refreshToken;
  final UserModel user;

  LoginResult({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });
}

class AuthRepository {
  final _apiService = ApiService();
  final _tempStorage = const FlutterSecureStorage();

  Future<LoginResult> login(String username, String password) async {
    try {
      print('🔐 [AuthRepository] Tentative de connexion pour: $username');
      print('🔐 [AuthRepository] URL API: ${AppConfig.baseUrl}/api/auth/login/');
      
      final response = await _apiService.post(
        '/api/auth/login/',
        data: {
          'username': username,
          'password': password,
        },
      );

      print('✅ [AuthRepository] Réponse reçue: ${response.statusCode}');
      print('📦 [AuthRepository] Données: ${response.data}');

      if (response.data == null) {
        throw Exception('Réponse vide de l\'API');
      }

      if (response.data['access'] == null) {
        print('❌ [AuthRepository] Pas de token access dans la réponse');
        print('📦 [AuthRepository] Structure de la réponse: ${response.data.keys}');
        throw Exception('Token d\'accès manquant dans la réponse');
      }

      // Sauvegarder le token temporairement pour pouvoir récupérer l'utilisateur
      final accessToken = response.data['access'];
      final refreshToken = response.data['refresh'] ?? '';
      
      // Récupérer les données utilisateur via /auth/users/me/
      print('👤 [AuthRepository] Récupération des données utilisateur...');
      UserModel user;
      try {
        // Stocker temporairement le token pour l'appel suivant
        await _tempStorage.write(key: 'access_token', value: accessToken);
        
        // Récupérer l'utilisateur
        user = await getCurrentUser();
        print('✅ [AuthRepository] Données utilisateur récupérées: ${user.email ?? user.username}');
      } catch (e) {
        print('❌ [AuthRepository] Erreur lors de la récupération de l\'utilisateur: $e');
        // Nettoyer le token temporaire en cas d'erreur
        await _tempStorage.delete(key: 'access_token');
        throw Exception('Impossible de récupérer les données utilisateur: $e');
      }

      final result = LoginResult(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      );

      print('✅ [AuthRepository] Connexion réussie pour: ${result.user.email ?? result.user.username}');
      return result;
    } catch (e, stackTrace) {
      print('❌ [AuthRepository] Erreur lors de la connexion: $e');
      print('📚 [AuthRepository] Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Convertit récursivement Map/listes en Map<String, dynamic> / List pour éviter les casts Map<dynamic, dynamic>.
  static Map<String, dynamic> _toJsonMap(dynamic value) {
    if (value == null) return {};
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((k, v) => MapEntry(k.toString(), _toJsonValue(v)));
    }
    return {};
  }

  static dynamic _toJsonValue(dynamic value) {
    if (value == null) return null;
    if (value is Map) return _toJsonMap(value);
    if (value is List) return value.map(_toJsonValue).toList();
    return value;
  }

  Future<UserModel> getCurrentUser() async {
    // Ne pas utiliser get<Map<String, dynamic>> : Dio renvoie _Map<dynamic, dynamic>, le cast échoue.
    final response = await _apiService.get(
      '/api/auth/users/me/',
      useCache: false,
    );
    final data = response.data;
    if (data == null) throw Exception('Réponse vide');
    final Map<String, dynamic> json = _toJsonMap(data);
    return UserModel.fromJson(json);
  }

  Future<void> logout() async {
    // Le logout est géré localement (suppression du token)
  }
}
