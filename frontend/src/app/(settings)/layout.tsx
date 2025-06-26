"use client"; // Settings pages will likely involve client-side interactions and forms

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import classNames from 'classnames';
import { Cog, Cloud, Puzzle, KeyRound, ArrowLeft } from 'lucide-react'; // Icons, Added ArrowLeft

const settingsNavItems = [
  { name: 'AI 服务商', href: '/providers', icon: Cloud },
  { name: '模型管理', href: '/models', icon: Cog },
  { name: 'MCP 服务', href: '/mcp', icon: Puzzle },
  // { name: 'API 密钥', href: '/keys', icon: KeyRound }, // API Keys might be part of Provider settings
  { name: '应用设置', href: '/application', icon: Cog }, // General app settings
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // e.g., /providers, /models
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row h-full">
      <nav className="w-full md:w-60 bg-[var(--color-panel)] p-4 md:border-r border-[var(--color-accent)]">
        <h2 className="text-xl font-semibold mb-6">设置</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => router.back()} // Use router.back() to go to the previous page
              className="flex items-center p-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 w-full text-left"
            >
              <ArrowLeft size={18} className="mr-3" suppressHydrationWarning />
              返回
            </button>
          </li>
          <li className="pt-2 mt-2 border-t border-gray-300 dark:border-gray-700"></li> {/* Divider */}
          {settingsNavItems.map((item) => {
            const fullItemPath = `/settings${item.href}`;
            const isActive = pathname === fullItemPath;
            return (
              <li key={item.name}>
                <Link
                  href={item.href} // item.href is like /providers, Next.js resolves this to /settings/providers
                  className={classNames(
                    "flex items-center p-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700",
                    {
                      "bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 text-[var(--color-primary-foreground)] font-medium": isActive,
                      "text-gray-700 dark:text-gray-300": !isActive,
                    }
                  )}
                >
                  <item.icon size={18} className="mr-3" suppressHydrationWarning />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}