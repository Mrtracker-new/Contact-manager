class Document {
  int? id;
  String name;
  String filePath;
  String category;
  String uploadDate;

  Document({
    this.id,
    required this.name,
    required this.filePath,
    required this.category,
    required this.uploadDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'file_path': filePath,
      'category': category,
      'upload_date': uploadDate,
    };
  }

  factory Document.fromMap(Map<String, dynamic> map) {
    return Document(
      id: map['id'],
      name: map['name'],
      filePath: map['file_path'],
      category: map['category'],
      uploadDate: map['upload_date'],
    );
  }
}