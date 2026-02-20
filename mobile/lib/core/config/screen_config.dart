import 'package:flutter/material.dart';

/// Seuils de largeur (logical pixels) pour adapter l'UI téléphone / tablette.
/// Utiliser [ScreenConfig.isTablet] ou [ScreenConfig.breakpoint] dans les écrans.
class ScreenConfig {
  ScreenConfig._();

  /// Largeur à partir de laquelle on considère l'appareil comme une tablette (portrait).
  static const double tabletBreakpoint = 600;

  /// Largeur pour « large tablette » / desktop (ex. iPad Pro, fenêtre large).
  static const double largeTabletBreakpoint = 840;

  /// Marge / padding de base à augmenter sur tablette.
  static const double phonePadding = 16.0;
  static const double tabletPadding = 24.0;
  static const double largeTabletPadding = 32.0;

  /// Nombre de colonnes cible pour les grilles (liste de cours, etc.).
  static int gridCrossAxisCount(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= largeTabletBreakpoint) return 4;
    if (w >= tabletBreakpoint) return 3;
    return 2;
  }

  /// Retourne true si la largeur actuelle correspond à une tablette ou plus.
  static bool isTablet(BuildContext context) {
    return MediaQuery.sizeOf(context).width >= tabletBreakpoint;
  }

  /// Retourne true si large tablette / desktop.
  static bool isLargeTablet(BuildContext context) {
    return MediaQuery.sizeOf(context).width >= largeTabletBreakpoint;
  }

  /// Padding horizontal adapté (téléphone vs tablette).
  static double horizontalPadding(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= largeTabletBreakpoint) return largeTabletPadding;
    if (w >= tabletBreakpoint) return tabletPadding;
    return phonePadding;
  }

  /// Contrainte de largeur max pour le contenu (éviter lignes trop longues sur tablette).
  static double maxContentWidth(BuildContext context) {
    if (isLargeTablet(context)) return 1200;
    if (isTablet(context)) return 800;
    return double.infinity;
  }

  /// Breakpoint actuel : [Breakpoint.phone], [Breakpoint.tablet], [Breakpoint.largeTablet].
  static Breakpoint breakpoint(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    if (w >= largeTabletBreakpoint) return Breakpoint.largeTablet;
    if (w >= tabletBreakpoint) return Breakpoint.tablet;
    return Breakpoint.phone;
  }
}

enum Breakpoint { phone, tablet, largeTablet }
