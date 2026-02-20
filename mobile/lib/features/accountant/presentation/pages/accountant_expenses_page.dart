import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';

class AccountantExpensesPage extends ConsumerStatefulWidget {
  const AccountantExpensesPage({super.key});

  @override
  ConsumerState<AccountantExpensesPage> createState() => _AccountantExpensesPageState();
}

class _AccountantExpensesPageState extends ConsumerState<AccountantExpensesPage> {
  List<dynamic> _expenses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService().get('/api/payments/expenses/');
      setState(() {
        _expenses = response.data is List ? response.data : (response.data['results'] ?? []);
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
        title: const Text('Dépenses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Créer une nouvelle dépense
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _expenses.isEmpty
              ? const Center(child: Text('Aucune dépense'))
              : RefreshIndicator(
                  onRefresh: _loadExpenses,
                  child: ListView.builder(
                    itemCount: _expenses.length,
                    itemBuilder: (context, index) {
                      final expense = _expenses[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ListTile(
                          leading: const Icon(Icons.money_off, color: Colors.red),
                          title: Text(expense['description'] ?? 'Dépense'),
                          subtitle: Text('${expense['amount'] ?? 0} ${expense['currency'] ?? 'CDF'}'),
                          trailing: Chip(
                            label: Text(expense['status'] == 'PAID' ? 'Payée' : 'En attente'),
                            backgroundColor: expense['status'] == 'PAID' 
                                ? Colors.green.withOpacity(0.2)
                                : Colors.orange.withOpacity(0.2),
                          ),
                          onTap: () {
                            // TODO: Voir les détails
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
