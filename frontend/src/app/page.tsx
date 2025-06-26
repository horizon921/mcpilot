import Link from 'next/link';
import { MessageSquare, PenSquare, Settings } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative">
      <div className="absolute top-6 right-6">
        <Link href="/providers">
          <div className="p-2 rounded-full hover:bg-[var(--color-accent)] transition-colors cursor-pointer" title="设置">
            <Settings size={24} />
          </div>
        </Link>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[var(--color-primary)] mb-3">Welcome to MCPilot</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Your advanced AI-powered assistant.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-8">
        <Link href="/chat/new">
          <div className="bg-[var(--color-card)] p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col items-center text-center">
            <MessageSquare size={48} className="text-[var(--color-primary)] mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Chat</h2>
            <p className="text-gray-600 dark:text-gray-300">Engage in a conversation with our general-purpose AI assistant.</p>
          </div>
        </Link>
        <Link href="/agents/political-essay">
          <div className="bg-[var(--color-card)] p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col items-center text-center">
            <PenSquare size={48} className="text-[var(--color-primary)] mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Political Science Essay Agent</h2>
            <p className="text-gray-600 dark:text-gray-300">A specialized agent to assist with writing political science essays.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}