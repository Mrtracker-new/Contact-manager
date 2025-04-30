import 'package:flutter/material.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'home_screen.dart';

void main() async {
  tz.initializeTimeZones();
  WidgetsFlutterBinding.ensureInitialized();
  
  // Removed notification initialization for now
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Digital Organizer',
      home: HomeScreen(),
    );
  }
}