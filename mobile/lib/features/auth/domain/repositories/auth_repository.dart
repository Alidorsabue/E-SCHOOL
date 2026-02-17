import '../models/user_model.dart';
import '../../../../core/network/api_service.dart';

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

  Future<LoginResult> login(String username, String password) async {
    final response = await _apiService.post(
      '/auth/login/',
      data: {
        'username': username,
        'password': password,
      },
    );

    return LoginResult(
      accessToken: response.data['access'],
      refreshToken: response.data['refresh'],
      user: UserModel.fromJson(response.data['user']),
    );
  }

  Future<UserModel> getCurrentUser() async {
    final response = await _apiService.get('/auth/users/me/');
    return UserModel.fromJson(response.data);
  }

  Future<void> logout() async {
    // Le logout est géré localement (suppression du token)
  }
}
