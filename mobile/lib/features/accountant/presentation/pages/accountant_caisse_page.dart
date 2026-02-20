import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';

class AccountantCaissePage extends ConsumerStatefulWidget {
  const AccountantCaissePage({super.key});

  @override
  ConsumerState<AccountantCaissePage> createState() => _AccountantCaissePageState();
}

class _AccountantCaissePageState extends ConsumerState<AccountantCaissePage> {
  Map<String, dynamic>? _caisseData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCaisse();
  }

  Future<void> _loadCaisse() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/payments/caisse/');
      setState(() {
        _caisseData = response.data is Map ? response.data : {};
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Caisse'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _caisseData == null
              ? const Center(child: Text('Données non disponibles'))
              : RefreshIndicator(
                  onRefresh: _loadCaisse,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Solde CDF
                        Card(
                          color: Colors.blue,
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              children: [
                                const Text(
                                  'Solde CDF',
                                  style: TextStyle(color: Colors.white, fontSize: 16),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '${_caisseData!['balance_cdf'] ?? 0} CDF',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Solde USD
                        Card(
                          color: Colors.green,
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              children: [
                                const Text(
                                  'Solde USD',
                                  style: TextStyle(color: Colors.white, fontSize: 16),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '${_caisseData!['balance_usd'] ?? 0} USD',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Actions
                        ElevatedButton.icon(
                          onPressed: () {
                            // TODO: Ajouter une transaction
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('Nouvelle transaction'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
