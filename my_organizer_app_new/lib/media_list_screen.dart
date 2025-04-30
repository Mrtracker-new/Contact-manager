import 'package:flutter/material.dart';

class MediaListScreen extends StatelessWidget {
  const MediaListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Media'),
      ),
      body: const Center(
        child: Text('Media List Screen'),
      ),
    );
  }
}
