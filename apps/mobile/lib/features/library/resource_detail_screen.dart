import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_filex/open_filex.dart';

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
  double? _progress;

  Future<void> _download(ResourceSummary resource) async {
    if (!resource.hasFile) return;
    setState(() {
      _downloading = true;
      _progress = 0;
    });
    try {
      final item = await ref.read(offlineDownloadProvider).downloadResource(
            resourceId: resource.id,
            title: resource.title,
            fileName: resource.fileName ?? resource.title,
            type: resource.type,
            onProgress: (received, total) {
              if (!mounted || total <= 0) return;
              setState(() => _progress = received / total);
            },
          );
      ref.invalidate(offlineFilesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved offline: ${item.fileName}'),
            action: SnackBarAction(
              label: 'Open',
              onPressed: () => OpenFilex.open(item.path),
            ),
          ),
        );
        setState(() {});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _downloading = false;
          _progress = null;
        });
      }
    }
  }

  Future<void> _openOffline(OfflineFileMeta item) async {
    final result = await OpenFilex.open(item.path);
    if (result.type != ResultType.done && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not open file: ${result.message}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final resourceAsync = ref.watch(resourceDetailProvider(widget.resourceId));
    final offlineAsync = ref.watch(offlineFilesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Resource')),
      body: resourceAsync.when(
        data: (resource) {
          final offline = offlineAsync.maybeWhen(
            data: (items) {
              try {
                return items.firstWhere((e) => e.resourceId == resource.id);
              } catch (_) {
                return null;
              }
            },
            orElse: () => null,
          );

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 450),
                curve: Curves.easeOut,
                builder: (context, value, child) => Opacity(
                  opacity: value,
                  child: Transform.translate(
                    offset: Offset(0, 12 * (1 - value)),
                    child: child,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
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
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                    ),
                    if (resource.subjectCode != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '${resource.subjectCode} ? ${resource.subjectName ?? ''}',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ],
                    if (resource.description != null) ...[
                      const SizedBox(height: 16),
                      Text(resource.description!),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'File',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(resource.fileName ?? 'No file attached'),
                      Text(
                        formatFileSize(resource.fileSize),
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                      if (offline != null) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Icon(Icons.offline_pin, color: Colors.green.shade700, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              'Kept in this app for offline use',
                              style: TextStyle(
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (resource.hasFile) ...[
                if (_downloading && _progress != null) ...[
                  LinearProgressIndicator(
                    value: _progress,
                    color: AppColors.primary,
                    backgroundColor: Colors.grey.shade200,
                  ),
                  const SizedBox(height: 12),
                ],
                if (offline != null)
                  FilledButton.icon(
                    onPressed: () => _openOffline(offline),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open kept file'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size.fromHeight(48),
                    ),
                  )
                else
                  FilledButton.icon(
                    onPressed: _downloading ? null : () => _download(resource),
                    icon: _downloading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.download_for_offline_outlined),
                    label: Text(
                      _downloading ? 'Downloading?' : 'Download & keep offline',
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                if (offline != null) ...[
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _downloading
                        ? null
                        : () async {
                            await ref
                                .read(offlineDownloadProvider)
                                .deleteDownloaded(resource.id);
                            ref.invalidate(offlineFilesProvider);
                            if (mounted) setState(() {});
                          },
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Remove from offline storage'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ],
              ] else
                const Text('This resource has no downloadable file.'),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
