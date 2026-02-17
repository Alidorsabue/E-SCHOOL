import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseService {
  static Database? _database;
  static const String _dbName = 'eschool_mobile.db';
  static const int _dbVersion = 1;
  
  static Future<void> init(String path) async {
    final dbPath = join(path, _dbName);
    _database = await openDatabase(
      dbPath,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }
  
  static Future<void> _onCreate(Database db, int version) async {
    // ===== TABLES ÉLÈVES =====
    
    // Table des cours téléchargés
    await db.execute('''
      CREATE TABLE downloaded_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content_path TEXT,
        downloaded_at INTEGER NOT NULL,
        file_size INTEGER,
        is_complete INTEGER DEFAULT 0
      )
    ''');
    
    // Table des devoirs
    await db.execute('''
      CREATE TABLE assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date INTEGER,
        course_id INTEGER,
        status TEXT,
        submitted_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des examens
    await db.execute('''
      CREATE TABLE exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date INTEGER,
        end_date INTEGER,
        duration INTEGER,
        course_id INTEGER,
        status TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des notes (utilisée par élèves et parents)
    await db.execute('''
      CREATE TABLE grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_id INTEGER UNIQUE NOT NULL,
        student_id INTEGER,
        course_id INTEGER,
        assignment_id INTEGER,
        exam_id INTEGER,
        score REAL,
        max_score REAL,
        grade TEXT,
        comment TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des livres de la bibliothèque
    await db.execute('''
      CREATE TABLE library_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        description TEXT,
        cover_url TEXT,
        file_path TEXT,
        is_downloaded INTEGER DEFAULT 0,
        progress REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // ===== TABLES PARENTS =====
    
    // Table des inscriptions
    await db.execute('''
      CREATE TABLE enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enrollment_id INTEGER UNIQUE,
        student_name TEXT NOT NULL,
        school_id INTEGER,
        class_id INTEGER,
        status TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des notes des enfants (pour parents)
    await db.execute('''
      CREATE TABLE children_grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_id INTEGER UNIQUE NOT NULL,
        child_id INTEGER NOT NULL,
        course_id INTEGER,
        score REAL,
        max_score REAL,
        grade TEXT,
        comment TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des réunions
    await db.execute('''
      CREATE TABLE meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date INTEGER,
        teacher_id INTEGER,
        status TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // Table des paiements
    await db.execute('''
      CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER UNIQUE NOT NULL,
        fee_type TEXT,
        amount REAL,
        currency TEXT,
        status TEXT,
        due_date INTEGER,
        paid_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    
    // ===== TABLE COMMUNE =====
    
    // Table de synchronisation (pour gérer les données en attente)
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        created_at INTEGER NOT NULL,
        synced_at INTEGER,
        retry_count INTEGER DEFAULT 0
      )
    ''');
    
    // Index pour améliorer les performances
    await db.execute('CREATE INDEX idx_assignments_course ON assignments(course_id)');
    await db.execute('CREATE INDEX idx_exams_course ON exams(course_id)');
    await db.execute('CREATE INDEX idx_grades_course ON grades(course_id)');
    await db.execute('CREATE INDEX idx_grades_student ON grades(student_id)');
    await db.execute('CREATE INDEX idx_children_grades_child ON children_grades(child_id)');
    await db.execute('CREATE INDEX idx_sync_queue_table ON sync_queue(table_name)');
  }
  
  static Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Gérer les migrations de base de données
  }
  
  static Database get database {
    if (_database == null) {
      throw Exception('Database not initialized. Call init() first.');
    }
    return _database!;
  }
  
  static Future<void> close() async {
    await _database?.close();
    _database = null;
  }
}
