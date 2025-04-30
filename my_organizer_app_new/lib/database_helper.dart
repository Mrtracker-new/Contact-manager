import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  // Singleton instance.
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  factory DatabaseHelper() => _instance;
  
  // Private named constructor.
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'my_organizer.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT,
        email TEXT,
        address TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        file_path TEXT,
        category TEXT,
        upload_date TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, -- 'photo', 'video', 'audio'
        file_path TEXT,
        date TEXT,
        description TEXT
      )
    ''');
    // Create a reminders table if you plan to use the reminder methods.
    await db.execute('''
      CREATE TABLE reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        date TEXT,
        description TEXT
      )
    ''');
  }

  // Contacts methods.
  Future<int> insertContact(Map<String, dynamic> contact) async {
    Database db = await database;
    return await db.insert('contacts', contact);
  }

  Future<List<Map<String, dynamic>>> getContacts() async {
    Database db = await database;
    return await db.query('contacts');
  }

  Future<int> updateContact(Map<String, dynamic> contact) async {
    Database db = await database;
    return await db.update(
      'contacts',
      contact,
      where: 'id = ?',
      whereArgs: [contact['id']],
    );
  }

  Future<int> deleteContact(int id) async {
    Database db = await database;
    return await db.delete(
      'contacts',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Documents methods.
  Future<int> insertDocument(Map<String, dynamic> document) async {
    Database db = await database;
    return await db.insert('documents', document);
  }

  Future<List<Map<String, dynamic>>> getDocuments() async {
    Database db = await database;
    return await db.query('documents');
  }

  Future<int> updateDocument(Map<String, dynamic> document) async {
    Database db = await database;
    return await db.update(
      'documents',
      document,
      where: 'id = ?',
      whereArgs: [document['id']],
    );
  }

  Future<int> deleteDocument(int id) async {
    Database db = await database;
    return await db.delete(
      'documents',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Reminders methods.
  Future<int> insertReminder(Map<String, dynamic> reminder) async {
    Database db = await database;
    return await db.insert('reminders', reminder);
  }

  Future<List<Map<String, dynamic>>> getReminders() async {
    Database db = await database;
    return await db.query('reminders');
  }

  Future<int> updateReminder(Map<String, dynamic> reminder) async {
    Database db = await database;
    return await db.update(
      'reminders',
      reminder,
      where: 'id = ?',
      whereArgs: [reminder['id']],
    );
  }

  Future<int> deleteReminder(int id) async {
    Database db = await database;
    return await db.delete(
      'reminders',
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
