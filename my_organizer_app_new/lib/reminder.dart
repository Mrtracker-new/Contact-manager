class Reminder {
  int? id;
  String title;
  DateTime dateTime;
  String relatedItemType;
  int relatedItemId;

  Reminder({
    this.id,
    required this.title,
    required this.dateTime,
    required this.relatedItemType,
    required this.relatedItemId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'date_time': dateTime.toIso8601String(),
      'related_item_type': relatedItemType,
      'related_item_id': relatedItemId,
    };
  }

  factory Reminder.fromMap(Map<String, dynamic> map) {
    return Reminder(
      id: map['id'],
      title: map['title'],
      dateTime: DateTime.parse(map['date_time']),
      relatedItemType: map['related_item_type'],
      relatedItemId: map['related_item_id'],
    );
  }
}