import 'package:flutter/material.dart';
import 'database_helper.dart';
import 'contact.dart';

class ContactDetailScreen extends StatefulWidget {
  final Contact? contact;

  const ContactDetailScreen({this.contact, Key? key}) : super(key: key);

  @override
  State<ContactDetailScreen> createState() => _ContactDetailScreenState();
}

class _ContactDetailScreenState extends State<ContactDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  String? name, phone, email, address;

  @override
  void initState() {
    super.initState();
    if (widget.contact != null) {
      name = widget.contact!.name;
      phone = widget.contact!.phone;
      email = widget.contact!.email;
      address = widget.contact!.address;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.contact == null ? 'Add Contact' : 'Edit Contact'),
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
                initialValue: phone,
                decoration: const InputDecoration(labelText: 'Phone'),
                validator: (value) => value!.isEmpty ? 'Required' : null,
                onSaved: (value) => phone = value,
              ),
              TextFormField(
                initialValue: email,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) => value!.isEmpty ? 'Required' : null,
                onSaved: (value) => email = value,
              ),
              TextFormField(
                initialValue: address,
                decoration: const InputDecoration(labelText: 'Address'),
                validator: (value) => value!.isEmpty ? 'Required' : null,
                onSaved: (value) => address = value,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saveContact,
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _saveContact() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      Contact newContact = Contact(
        id: widget.contact?.id,
        name: name!,
        phone: phone!,
        email: email!,
        address: address!,
      );
      if (widget.contact == null) {
        DatabaseHelper().insertContact(newContact.toMap());
      } else {
        DatabaseHelper().updateContact(newContact.toMap());
      }
      Navigator.pop(context);
    }
  }
}