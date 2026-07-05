'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { listAssistantSessions } from '@/lib/ai-assistant';
import { AiAssistantChat } from '@/components/assistant/AiAssistantChat';

export default function AssistantSessionPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.accessToken());

  const { data: sessions = [] } = useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => listAssistantSessions(token!),
    enabled: !!token,
  });

  return (
    <div className="-m-4 flex min-h-[calc(100vh-2rem)] flex-col md:-m-8 md:min-h-[calc(100vh-4rem)] md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white md:flex">
        <div className="border-b p-4">
          <Link
            href="/assistant"
            className="text-sm font-medium text-efundo-primary hover:underline"
          >
            ← All conversations
          </Link>
          <Link
            href="/assistant"
            className="mt-3 block w-full rounded-lg bg-efundo-primary px-3 py-2 text-center text-sm font-semibold text-white hover:bg-efundo-primary-dark"
          >
            + New chat
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/assistant/${s.id}`}
              className={`mb-1 block rounded-lg px-3 py-2 text-sm ${
                s.id === id
                  ? 'bg-efundo-primary/10 font-medium text-efundo-primary'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="line-clamp-2">{s.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
        <div className="border-b bg-white px-4 py-2 md:hidden">
          <Link href="/assistant" className="text-sm text-efundo-primary hover:underline">
            ← Conversations
          </Link>
        </div>
        <AiAssistantChat sessionId={id} />
      </div>
    </div>
  );
}
