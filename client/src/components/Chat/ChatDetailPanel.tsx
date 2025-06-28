"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/Common/Button';
import { X, Settings } from 'lucide-react'; // Close button icon, Settings icon
import { ScrollArea } from '@/components/Common/ScrollArea';

import type { ChatSession } from '@/types/chat';
import { ChatSettingsPanel } from './ChatSettingsPanel';

interface ChatDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatSession: ChatSession | null | undefined;
}

const ChatDetailPanel: React.FC<ChatDetailPanelProps> = ({
  isOpen,
  onClose,
  activeChatSession
}) => {
  const router = useRouter(); // Initialize router

  // 右侧面板常驻渲染，由父组件控制动画和显示
  return (
    <aside className="w-full h-full flex flex-col border-l border-gray-200 dark:border-gray-700 bg-[var(--color-panel)] shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">聊天详情与设置</h2>
        <Button variant="ghost" size="icon" onClick={onClose} title="关闭面板">
          <X size={20} />
        </Button>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          <ChatSettingsPanel activeChatSession={activeChatSession} onClosePanel={onClose} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {/* 底部按钮已由 ChatSettingsPanel 内部“应用设置”按钮实现，无需重复 */}
      </div>
    </aside>
  );
};

export default ChatDetailPanel;