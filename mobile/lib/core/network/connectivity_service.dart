import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final _connectivity = Connectivity();
  List<ConnectivityResult> _currentResults = [ConnectivityResult.none];

  Future<void> init() async {
    _currentResults = await _connectivity.checkConnectivity();
    _connectivity.onConnectivityChanged.listen((results) {
      _currentResults = results;
    });
  }

  static Future<bool> isConnected() async {
    final instance = ConnectivityService();
    final results = await instance._connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  static Stream<List<ConnectivityResult>> get connectivityStream {
    return ConnectivityService()._connectivity.onConnectivityChanged;
  }

  static bool get isWifi {
    return ConnectivityService()._currentResults.contains(ConnectivityResult.wifi);
  }

  static bool get isMobile {
    return ConnectivityService()._currentResults.contains(ConnectivityResult.mobile);
  }
}
