'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import {
  getAssistantSession,
  sendAssistantMessage,
  uploadAssistantFile,
  removeAssistantFile,
  deleteAssistantSession,
  type AiAssistantMessage,
} from '@/lib/ai-assistant';

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ message }: { message: AiAssistantMessage }) {
  const isUser = message.role === 'USER';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-efundo-primary text-white'
            : 'border bg-white text-slate-800 shadow-sm'
        }`}
      >
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-efundo-primary">eFundo AI</p>
        )}
        {message.content}
      </div>
    </div>
  );
}

export function AiAssistantChat({ sessionId }: { sessionId: string }) {
  const token = useAuthStore((s) => s.accessToken());
  const queryClient = useQueryClient();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ['ai-session', sessionId],
    queryFn: () => getAssistantSession(sessionId, token!),
    enabled: !!token && !!sessionId,
    refetchInterval: (q) => {
      const files = q.state.data?.files ?? [];
      const processing = files.some(
        (f) => f.status === 'PENDING' || f.status === 'EXTRACTING',
      );
      return processing ? 2000 : false;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);

  const sendMut = useMutation({
    mutationFn: (content: string) =>
      sendAssistantMessage(sessionId, content, token!),
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['ai-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-sessions'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !token) return;
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadAssistantFile(sessionId, file, token);
      }
      await queryClient.invalidateQueries({ queryKey: ['ai-session', sessionId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveFile(fileId: string) {
    if (!token) return;
    try {
      await removeAssistantFile(sessionId, fileId, token);
      await queryClient.invalidateQueries({ queryKey: ['ai-session', sessionId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove file');
    }
  }

  async function handleDelete() {
    if (!token || !confirm('Delete this conversation?')) return;
    await deleteAssistantSession(sessionId, token);
    router.push('/assistant');
  }

  if (isLoading || !session) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Loading conversation…
      </div>
    );
  }

  const filesProcessing = session.files.some(
    (f) => f.status === 'PENDING' || f.status === 'EXTRACTING',
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b bg-white px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-slate-900">{session.title}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {session.lesson
              ? `Lesson: ${session.lesson.title}`
              : session.subject
                ? `${session.subject.name} (${session.subject.code})`
                : 'General study help'}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {session.lesson && (
            <Link
              href={`/learn/lessons/${session.lesson.id}`}
              className="text-xs font-medium text-efundo-primary hover:underline"
            >
              View lesson
            </Link>
          )}
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </header>

      {session.files.length > 0 && (
        <div className="shrink-0 border-b bg-slate-50 px-4 py-2 md:px-6">
          <p className="text-xs font-medium text-slate-500">Uploaded assignments</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {session.files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1 text-xs"
              >
                <span className="max-w-[140px] truncate text-slate-700">{f.fileName}</span>
                <span className="text-slate-400">{formatBytes(f.fileSize)}</span>
                <span
                  className={
                    f.status === 'READY'
                      ? 'text-green-600'
                      : f.status === 'FAILED'
                        ? 'text-red-600'
                        : 'text-amber-600'
                  }
                >
                  {f.status === 'READY'
                    ? '✓'
                    : f.status === 'FAILED'
                      ? '!'
                      : '…'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemoveFile(f.id)}
                  className="text-red-500 hover:underline"
                  aria-label="Remove file"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {session.messages.length === 0 ? (
          <div className="mx-auto max-w-lg py-12 text-center">
            <p className="text-lg font-medium text-slate-800">How can I help you study?</p>
            <p className="mt-2 text-sm text-slate-500">
              Ask a question about your lesson, or upload an assignment (PDF or photo) for
              step-by-step guidance.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'Explain this topic in simpler terms',
                'Help me understand this assignment',
                'Quiz me on the key concepts',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setError('');
                    sendMut.mutate(suggestion);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-efundo-primary/40 hover:text-efundo-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {session.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {sendMut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="shrink-0 px-4 text-sm text-red-600 md:px-6">{error}</p>
      )}

      <form
        className="shrink-0 border-t bg-white p-4 md:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || sendMut.isPending || filesProcessing) return;
          setError('');
          sendMut.mutate(input.trim());
        }}
      >
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*,text/plain"
            multiple
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading || filesProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Upload assignment"
          >
            {uploading ? '…' : '📎'}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              filesProcessing
                ? 'Waiting for file processing…'
                : 'Ask a question about your lesson or assignment…'
            }
            disabled={sendMut.isPending || filesProcessing}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-efundo-primary focus:outline-none focus:ring-1 focus:ring-efundo-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMut.isPending || filesProcessing}
            className="shrink-0 rounded-xl bg-efundo-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-efundo-primary-dark disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
          AI guidance is for learning support — always verify important facts with your
          instructor.
        </p>
      </form>
    </div>
  );
}
