import 'package:flutter/material.dart';
import 'database_helper.dart';
import 'document.dart';
import 'document_detail_screen.dart';

class DocumentListScreen extends StatefulWidget {
  const DocumentListScreen({Key? key}) : super(key: key);

  @override
  State<DocumentListScreen> createState() => _DocumentListScreenState();
}

class _DocumentListScreenState extends State<DocumentListScreen> {
  List<Document> documents = [];

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    List<Map<String, dynamic>> documentMaps = await DatabaseHelper().getDocuments();
    setState(() {
      documents = documentMaps.map((map) => Document.fromMap(map)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
      ),
      body: ListView.builder(
        itemCount: documents.length,
        itemBuilder: (context, index) {
          return ListTile(
            title: Text(documents[index].name),
            subtitle: Text(documents[index].category),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DocumentDetailScreen(document: documents[index]),
                ),
              ).then((_) => _loadDocuments());
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const DocumentDetailScreen(),
            ),
          ).then((_) => _loadDocuments());
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}