import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/courses/presentation/pages/courses_page.dart';
import '../../features/courses/presentation/pages/course_detail_page.dart';
import '../../features/assignments/presentation/pages/assignments_page.dart';
import '../../features/assignments/presentation/pages/assignment_detail_page.dart';
import '../../features/exams/presentation/pages/exams_page.dart';
import '../../features/exams/presentation/pages/exam_detail_page.dart';
import '../../features/library/presentation/pages/library_page.dart';
import '../../features/library/presentation/pages/book_detail_page.dart';
import '../../features/grades/presentation/pages/grades_page.dart';
import '../../features/enrollment/presentation/pages/enrollment_page.dart';
import '../../features/meetings/presentation/pages/meetings_page.dart';
import '../../features/payments/presentation/pages/payments_page.dart';
import '../../features/tutoring/presentation/pages/tutoring_page.dart';
import '../../features/discipline/presentation/pages/discipline_page.dart';
import '../../features/communication/presentation/pages/communication_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';
      final user = authState.user;
      final userRole = user?.role;
      
      // Redirection si non authentifié
      if (!isAuthenticated && !isLoggingIn) {
        return '/login';
      }
      
      // Redirection si authentifié et sur la page de login
      if (isAuthenticated && isLoggingIn) {
        return '/dashboard';
      }
      
      // Vérification des routes selon le rôle
      if (isAuthenticated && userRole != null) {
        final path = state.matchedLocation;
        
        // Élève : pas d'accès inscription, réunions, paiements, encadrement (réservés aux parents)
        if (userRole == 'STUDENT') {
          if (path.startsWith('/enrollment') || path.startsWith('/meetings') ||
              path.startsWith('/payments') || path.startsWith('/tutoring')) {
            return '/dashboard';
          }
        }
        // Parent : pas d'accès cours, devoirs, examens (réservés aux élèves)
        if (userRole == 'PARENT') {
          if (path.startsWith('/courses') || path.startsWith('/assignments') || path.startsWith('/exams')) {
            return '/dashboard';
          }
        }
        // Discipline et Communication : accessibles Parent et Élève (aligné web)
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      // Routes pour les élèves
      GoRoute(
        path: '/courses',
        builder: (context, state) => const CoursesPage(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return CourseDetailPage(courseId: int.parse(id));
            },
          ),
        ],
      ),
      GoRoute(
        path: '/assignments',
        builder: (context, state) => const AssignmentsPage(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return AssignmentDetailPage(assignmentId: int.parse(id));
            },
          ),
        ],
      ),
      GoRoute(
        path: '/exams',
        builder: (context, state) => const ExamsPage(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return ExamDetailPage(examId: int.parse(id));
            },
          ),
        ],
      ),
      // Routes pour les parents
      GoRoute(
        path: '/enrollment',
        builder: (context, state) => const EnrollmentPage(),
      ),
      GoRoute(
        path: '/meetings',
        builder: (context, state) => const MeetingsPage(),
      ),
      GoRoute(
        path: '/payments',
        builder: (context, state) => const PaymentsPage(),
      ),
      GoRoute(
        path: '/tutoring',
        builder: (context, state) => const TutoringPage(),
      ),
      GoRoute(
        path: '/discipline',
        builder: (context, state) => const DisciplinePage(),
      ),
      GoRoute(
        path: '/communication',
        builder: (context, state) => const CommunicationPage(),
      ),
      // Routes communes
      GoRoute(
        path: '/library',
        builder: (context, state) => const LibraryPage(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return BookDetailPage(bookId: int.parse(id));
            },
          ),
        ],
      ),
      GoRoute(
        path: '/grades',
        builder: (context, state) => const GradesPage(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfilePage(),
      ),
    ],
  );
});
