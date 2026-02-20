import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../../../../core/network/api_service.dart';

class PaymentReceiptPage extends ConsumerStatefulWidget {
  final int paymentId;

  const PaymentReceiptPage({super.key, required this.paymentId});

  @override
  ConsumerState<PaymentReceiptPage> createState() => _PaymentReceiptPageState();
}

class _PaymentReceiptPageState extends ConsumerState<PaymentReceiptPage> {
  Map<String, dynamic>? _payment;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPayment();
  }

  Future<void> _loadPayment() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/payments/payments/${widget.paymentId}/');
      setState(() {
        _payment = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _downloadReceipt() async {
    if (_payment == null) return;
    
    try {
      final status = await Permission.storage.request();
      if (!status.isGranted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Permission de stockage requise')),
        );
        return;
      }

      final dio = Dio();
      final api = ApiService();
      final token = await api.getToken();
      final paymentId = _payment!['id'];
      final paymentIdStr = _payment!['payment_id']?.toString() ?? paymentId.toString();
      
      final response = await dio.get(
        '${api.baseUrl}/api/payments/payments/$paymentId/download_receipt/',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          responseType: ResponseType.bytes,
        ),
      );

      final appDir = await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${appDir.path}/downloads/receipts');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }

      final file = File('${downloadDir.path}/receipt_$paymentIdStr.pdf');
      await file.writeAsBytes(response.data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Reçu téléchargé: ${file.path}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur lors du téléchargement: $e')),
        );
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Reçu de paiement')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_payment == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Reçu de paiement')),
        body: const Center(child: Text('Reçu non trouvé')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reçu de paiement'),
        actions: [
          if (_payment!['receipt'] != null)
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: _downloadReceipt,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // En-tête
                Center(
                  child: Column(
                    children: [
                      const Icon(Icons.receipt_long, size: 64, color: Colors.green),
                      const SizedBox(height: 16),
                      Text(
                        'REÇU DE PAIEMENT',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                const SizedBox(height: 16),
                // Informations de paiement
                _buildInfoRow('ID Paiement', _payment!['payment_id'] ?? 'N/A'),
                _buildInfoRow('Montant', '${_payment!['amount']} ${_payment!['currency'] ?? 'CDF'}'),
                if (_payment!['payment_date'] != null)
                  _buildInfoRow(
                    'Date de paiement',
                    DateFormat('dd/MM/yyyy HH:mm').format(
                      DateTime.parse(_payment!['payment_date'].toString()),
                    ),
                  ),
                if (_payment!['payment_method'] != null)
                  _buildInfoRow('Méthode', _payment!['payment_method']),
                const Divider(),
                const SizedBox(height: 16),
                // Type de frais
                if (_payment!['fee_type'] != null) ...[
                  const Text(
                    'Type de frais',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  _buildInfoRow('Nom', _payment!['fee_type']['name'] ?? 'N/A'),
                ],
                const SizedBox(height: 16),
                // Reçu
                if (_payment!['receipt'] != null) ...[
                  const Divider(),
                  const SizedBox(height: 16),
                  Center(
                    child: ElevatedButton.icon(
                      onPressed: _downloadReceipt,
                      icon: const Icon(Icons.download),
                      label: const Text('Télécharger le reçu'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(value),
        ],
      ),
    );
  }
}
