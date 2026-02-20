import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_service.dart';

class DisciplineRequestModal extends ConsumerStatefulWidget {
  final int disciplineRecordId;
  final Function()? onSubmitted;

  const DisciplineRequestModal({
    super.key,
    required this.disciplineRecordId,
    this.onSubmitted,
  });

  @override
  ConsumerState<DisciplineRequestModal> createState() => _DisciplineRequestModalState();
}

class _DisciplineRequestModalState extends ConsumerState<DisciplineRequestModal> {
  final _formKey = GlobalKey<FormState>();
  final _messageController = TextEditingController();
  String _requestType = 'APOLOGY';
  bool _isSubmitting = false;

  final Map<String, String> _requestTypeLabels = {
    'APOLOGY': 'Demande d\'excuse',
    'PUNISHMENT_LIFT': 'Demande de levée de punition',
    'APPEAL': 'Recours',
    'DISCUSSION': 'Discussion',
  };

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      await ApiService().post('/api/academics/discipline-requests/', data: {
        'discipline_record': widget.disciplineRecordId,
        'request_type': _requestType,
        'message': _messageController.text,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Demande envoyée avec succès')),
        );
        widget.onSubmitted?.call();
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxHeight: 500),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // En-tête
              AppBar(
                title: const Text('Créer une demande'),
                automaticallyImplyLeading: false,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              // Contenu
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Type de demande
                      DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'Type de demande *',
                          border: OutlineInputBorder(),
                        ),
                        value: _requestType,
                        items: _requestTypeLabels.entries.map((entry) {
                          return DropdownMenuItem(
                            value: entry.key,
                            child: Text(entry.value),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => _requestType = value ?? 'APOLOGY'),
                      ),
                      const SizedBox(height: 16),
                      // Message
                      TextFormField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          labelText: 'Message *',
                          border: OutlineInputBorder(),
                          hintText: 'Expliquez votre demande...',
                        ),
                        maxLines: 8,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Le message est requis' : null,
                      ),
                    ],
                  ),
                ),
              ),
              // Boutons
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
                        child: const Text('Annuler'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitRequest,
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Envoyer'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
