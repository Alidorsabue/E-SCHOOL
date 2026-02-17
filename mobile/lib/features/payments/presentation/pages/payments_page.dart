import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/network/api_service.dart';

class PaymentsPage extends ConsumerStatefulWidget {
  const PaymentsPage({super.key});

  @override
  ConsumerState<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends ConsumerState<PaymentsPage> {
  List<dynamic> _payments = [];
  List<dynamic> _pendingPayments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService().get('/payments/payments/');
      final allPayments = response.data as List<dynamic>;
      setState(() {
        _payments = allPayments.where((p) => p['status'] == 'completed').toList();
        _pendingPayments = allPayments.where((p) => p['status'] == 'pending').toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _processPayment(Map<String, dynamic> payment) async {
    // Ouvrir l'URL de paiement
    final paymentUrl = payment['payment_url'];
    if (paymentUrl != null && await canLaunchUrl(Uri.parse(paymentUrl))) {
      await launchUrl(Uri.parse(paymentUrl), mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'ouvrir le lien de paiement')),
        );
      }
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Paiements'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'En attente'),
              Tab(text: 'Historique'),
            ],
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  // Paiements en attente
                  _pendingPayments.isEmpty
                      ? const Center(child: Text('Aucun paiement en attente'))
                      : RefreshIndicator(
                          onRefresh: _loadPayments,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _pendingPayments.length,
                            itemBuilder: (context, index) {
                              final payment = _pendingPayments[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: _getStatusColor(payment['status']),
                                    child: const Icon(Icons.payment, color: Colors.white),
                                  ),
                                  title: Text(payment['fee_type']?['name'] ?? 'Paiement'),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Montant: ${payment['amount']} ${payment['currency'] ?? 'FCFA'}'),
                                      if (payment['due_date'] != null)
                                        Text(
                                          'Échéance: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(payment['due_date']))}',
                                        ),
                                    ],
                                  ),
                                  trailing: ElevatedButton(
                                    onPressed: () => _processPayment(payment),
                                    child: const Text('Payer'),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                  // Historique des paiements
                  _payments.isEmpty
                      ? const Center(child: Text('Aucun paiement effectué'))
                      : RefreshIndicator(
                          onRefresh: _loadPayments,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _payments.length,
                            itemBuilder: (context, index) {
                              final payment = _payments[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: _getStatusColor(payment['status']),
                                    child: const Icon(Icons.check, color: Colors.white),
                                  ),
                                  title: Text(payment['fee_type']?['name'] ?? 'Paiement'),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Montant: ${payment['amount']} ${payment['currency'] ?? 'FCFA'}'),
                                      if (payment['paid_at'] != null)
                                        Text(
                                          'Payé le: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(payment['paid_at']))}',
                                        ),
                                    ],
                                  ),
                                  trailing: payment['receipt'] != null
                                      ? IconButton(
                                          icon: const Icon(Icons.receipt),
                                          onPressed: () {
                                            // TODO: Voir le reçu
                                          },
                                        )
                                      : null,
                                ),
                              );
                            },
                          ),
                        ),
                ],
              ),
      ),
    );
  }
}
