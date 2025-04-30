import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart'; // Replace file_picker with image_picker
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'database_helper.dart';
import 'document.dart';

class DocumentDetailScreen extends StatefulWidget {
  final Document? document;

  const DocumentDetailScreen({this.document, Key? key}) : super(key: key);

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  String? name, category, filePath;
  final ImagePicker _picker = ImagePicker(); // Add ImagePicker instance

  @override
  void initState() {
    super.initState();
    if (widget.document != null) {
      name = widget.document!.name;
      category = widget.document!.category;
      filePath = widget.document!.filePath;
    }
  }

  Future<void> _pickFile() async {
    // Replace FilePicker with ImagePicker
    final XFile? pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      String originalPath = pickedFile.path;
      Directory appDir = await getApplicationDocumentsDirectory();
      String newPath = '${appDir.path}/documents/${DateTime.now().millisecondsSinceEpoch}_${pickedFile.name}';
      await Directory('${appDir.path}/documents').create(recursive: true);
      await File(originalPath).copy(newPath);
      setState(() {
        filePath = newPath;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.document == null ? 'Add Document' : 'Edit Document'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                initialValue: name,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: (value) => value!.isEmpty ? 'Required' : null,
                onSaved: (value) => name = value,
              ),
              TextFormField(
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Category'),
                validator: (value) => value!.isEmpty ? 'Required' : null,
                onSaved: (value) => category = value,
              ),
              if (filePath != null)
                Text('File: $filePath'),
              ElevatedButton(
                onPressed: _pickFile,
                child: const Text('Pick File'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saveDocument,
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _saveDocument() {
    if (_formKey.currentState!.validate() && filePath != null) {
      _formKey.currentState!.save();
      Document newDocument = Document(
        id: widget.document?.id,
        name: name!,
        filePath: filePath!,
        category: category!,
        uploadDate: DateTime.now().toIso8601String(),
      );
      if (widget.document == null) {
        DatabaseHelper().insertDocument(newDocument.toMap());
      } else {
        DatabaseHelper().updateDocument(newDocument.toMap());
      }
      Navigator.pop(context);
    } else if (filePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please pick a file')));
    }
  }
}