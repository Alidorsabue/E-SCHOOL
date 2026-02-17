import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();
  
  final _connectivity = Connectivity();
  ConnectivityResult _currentResult = ConnectivityResult.none;
  
  Future<void> init() async {
    _currentResult = await _connectivity.checkConnectivity();
    _connectivity.onConnectivityChanged.listen((result) {
      _currentResult = result;
    });
  }
  
  static Future<bool> isConnected() async {
    final instance = ConnectivityService();
    final result = await instance._connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }
  
  static Stream<ConnectivityResult> get connectivityStream {
    return ConnectivityService()._connectivity.onConnectivityChanged;
  }
  
  static bool get isWifi {
    return ConnectivityService()._currentResult == ConnectivityResult.wifi;
  }
  
  static bool get isMobile {
    return ConnectivityService()._currentResult == ConnectivityResult.mobile;
  }
}
