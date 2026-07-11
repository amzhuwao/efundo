import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/api_config.dart';
import '../../models/resource.dart';
import '../../providers/library_provider.dart';

class ResourceDetailScreen extends ConsumerStatefulWidget {
  const ResourceDetailScreen({super.key, required this.resourceId});

  final String resourceId;

  @override
  ConsumerState<ResourceDetailScreen> createState() =>
      _ResourceDetailScreenState();
}

class _ResourceDetailScreenState extends ConsumerState<ResourceDetailScreen> {
  var _downloading = false;

  Future<void> _download(ResourceSummary resource) async {
    if (!resource.hasFile) return;
    setState(() => _downloading = true);
    try {
      final file = await ref
          .read(offlineDownloadProvider)
          .downloadResource(resource.id, resource.fileName ?? resource.title);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved to ${file.path}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final resourceAsync = ref.watch(resourceDetailProvider(widget.resourceId));

    return Scaffold(
      appBar: AppBar(title: const Text('Resource')),
      body: resourceAsync.when(
        data: (resource) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                formatResourceType(resource.type),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              resource.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            if (resource.subjectCode != null) ...[
              const SizedBox(height: 8),
              Text(
                '${resource.subjectCode} — ${resource.subjectName ?? ''}',
                style: TextStyle(color: Colors.grey.shade600),
              ),
            ],
            if (resource.description != null) ...[
              const SizedBox(height: 16),
              Text(resource.description!),
            ],
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('File', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Text(resource.fileName ?? 'No file attached'),
                    Text(
                      formatFileSize(resource.fileSize),
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (resource.hasFile)
              FilledButton.icon(
                onPressed: _downloading ? null : () => _download(resource),
                icon: _downloading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.download_outlined),
                label: Text(_downloading ? 'Downloading…' : 'Download for offline'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size.fromHeight(48),
                ),
              )
            else
              const Text('This resource has no downloadable file.'),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
