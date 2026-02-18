import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      print('🚀 [LoginPage] Validation OK, démarrage du login...');
      final username = _usernameController.text.trim();
      final password = _passwordController.text;
      
      print('🚀 [LoginPage] Username: $username');
      
      final success = await ref.read(authProvider.notifier).login(username, password);

      print('🚀 [LoginPage] Résultat du login: success=$success');
      print('🚀 [LoginPage] État auth: isAuthenticated=${ref.read(authProvider).isAuthenticated}');

      if (!success && mounted) {
        final error = ref.read(authProvider).error ?? 'Erreur de connexion';
        print('❌ [LoginPage] Erreur affichée à l\'utilisateur: $error');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error),
            backgroundColor: Colors.red,
          ),
        );
      } else if (success && mounted) {
        print('✅ [LoginPage] Login réussi, attente de la redirection...');
        // Attendre un peu pour que le router détecte le changement
        await Future.delayed(const Duration(milliseconds: 200));
        if (mounted && ref.read(authProvider).isAuthenticated) {
          print('✅ [LoginPage] Redirection vers /dashboard');
          context.go('/dashboard');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    
    // Écouter les changements d'authentification pour forcer la mise à jour du router
    ref.listen<AuthState>(authProvider, (previous, next) {
      final wasNotAuthenticated = previous == null || !previous.isAuthenticated;
      if (next.isAuthenticated && wasNotAuthenticated && mounted) {
        // Forcer le router à re-vérifier le redirect en naviguant vers la route actuelle puis dashboard
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            // Le router devrait automatiquement rediriger, mais on force au cas où
            final router = GoRouter.of(context);
            if (router.routerDelegate.currentConfiguration.uri.path == '/login') {
              context.go('/dashboard');
            }
          }
        });
      }
    });

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                // Logo de l'application (à remplacer par assets/images/logo.png quand disponible)
                Image.asset(
                  'assets/images/logo.png',
                  height: 80,
                  width: 80,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback vers l'icône si le logo n'existe pas encore
                    return Icon(
                      Icons.school,
                      size: 80,
                      color: Theme.of(context).colorScheme.primary,
                    );
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  'Connexion',
                  style: Theme.of(context).textTheme.displaySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Connectez-vous à votre compte',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: 'Nom d\'utilisateur ou Email',
                    prefixIcon: Icon(Icons.person),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer votre nom d\'utilisateur';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: 'Mot de passe',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _handleLogin(),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer votre mot de passe';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: authState.isLoading ? null : _handleLogin,
                  child: authState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Se connecter'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
