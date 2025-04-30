import 'package:flutter/material.dart';
// Removed notification import
import 'database_helper.dart';
import 'reminder.dart';

class ReminderDetailScreen extends StatefulWidget {
  final Reminder? reminder;
  const ReminderDetailScreen({this.reminder, Key? key}) : super(key: key);

  @override
  State<ReminderDetailScreen> createState() => _ReminderDetailScreenState();
}

class _ReminderDetailScreenState extends State<ReminderDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  String? title, relatedItemType;
  int? relatedItemId;
  DateTime? dateTime;

  @override
  void initState() {
    super.initState();
    if (widget.reminder != null) {
      title = widget.reminder!.title;
      relatedItemType = widget.reminder!.relatedItemType;
      relatedItemId = widget.reminder!.relatedItemId;
      dateTime = widget.reminder!.dateTime;
    }
  }
  
  Future<void> _selectDateTime() async {
    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: dateTime ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (pickedDate != null && mounted) {
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(dateTime ?? DateTime.now()),
      );
      if (pickedTime != null) {
        setState(() {
          dateTime = DateTime(pickedDate.year, pickedDate.month, pickedDate.day,
              pickedTime.hour, pickedTime.minute);
        });
      }
    }
  }

  // Simplified notification method that just prints to console for now
  Future<void> _scheduleNotification(String title, DateTime dateTime) async {
    // For now, just print the notification details
    print('Would schedule notification: $title at $dateTime');
    // We'll implement actual notifications later
  }

  Future<void> _saveReminder() async {
    if (_formKey.currentState!.validate() && dateTime != null) {
      _formKey.currentState!.save();

      Reminder newReminder = Reminder(
        id: widget.reminder?.id,
        title: title!,
        dateTime: dateTime!,
        relatedItemType: relatedItemType ?? '',
        relatedItemId: relatedItemId ?? 0,
      );

      if (widget.reminder == null) {
        await DatabaseHelper().insertReminder(newReminder.toMap());
      } else {
        await DatabaseHelper().updateReminder(newReminder.toMap());
      }

      await _scheduleNotification(title!, dateTime!);
      if (mounted) {
        Navigator.pop(context);
      }
    } else if (dateTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date and time')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:
            Text(widget.reminder == null ? 'Add Reminder' : 'Edit Reminder'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                initialValue: title,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (value) =>
                    (value == null || value.isEmpty) ? 'Required' : null,
                onSaved: (value) => title = value,
              ),
              TextFormField(
                initialValue: relatedItemType,
                decoration: const InputDecoration(
                    labelText: 'Related Item Type (e.g., contact)'),
                onSaved: (value) => relatedItemType = value,
              ),
              TextFormField(
                initialValue: relatedItemId?.toString(),
                decoration: const InputDecoration(labelText: 'Related Item ID'),
                keyboardType: TextInputType.number,
                onSaved: (value) =>
                    relatedItemId = int.tryParse(value ?? ''),
              ),
              TextButton(
                onPressed: _selectDateTime,
                child: Text(dateTime == null
                    ? 'Select Date & Time'
                    : dateTime.toString()),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saveReminder,
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
