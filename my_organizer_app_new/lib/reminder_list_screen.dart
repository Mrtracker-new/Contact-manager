import 'package:flutter/material.dart';
import 'database_helper.dart';
import 'reminder.dart';
import 'reminder_detail_screen.dart';

class ReminderListScreen extends StatefulWidget {
  const ReminderListScreen({Key? key}) : super(key: key);

  @override
  State<ReminderListScreen> createState() => _ReminderListScreenState();
}

class _ReminderListScreenState extends State<ReminderListScreen> {
  List<Reminder> reminders = [];

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    List<Map<String, dynamic>> reminderMaps = await DatabaseHelper().getReminders();
    setState(() {
      reminders = reminderMaps.map((map) => Reminder.fromMap(map)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reminders')),
      body: ListView.builder(
        itemCount: reminders.length,
        itemBuilder: (context, index) {
          return ListTile(
            title: Text(reminders[index].title),
            subtitle: Text(reminders[index].dateTime.toString()),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ReminderDetailScreen(reminder: reminders[index])),
              ).then((_) => _loadReminders());
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => ReminderDetailScreen()),
          ).then((_) => _loadReminders());
        },
        child: Icon(Icons.add),
      ),
    );
  }
}