"use client";

import React from "react";
import Link from "next/link";
import { useRouter }
from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useUIStore } from "@/store/uiStore"; // For toggling sidebar on mobile perhaps
import { PlusCircle, MessageSquareText, Trash2, Edit2, Settings, ChevronLeft, ChevronRight } from "lucide-react"; // Added Settings icon and Chevron
import { Button } from "@/components/Common/Button";
import classNames from "classnames";

// A placeholder for a user ID, in a real app this would come from auth
const TEMP_USER_ID = "user-123";

const ChatSidebar: React.FC = () => {
  const router = useRouter();
  const { chatSessions, activeChatId, createChatSession, deleteChatSession, setActiveChatId, updateChatSessionTitle } = useChatStore();
  const { isSidebarOpen, isSidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore(); // Example usage

  const handleCreateNewChat = () => {
    const newSession = createChatSession(TEMP_USER_ID); // Assuming default model will be picked by store or page
    router.push(`/chat/${newSession.id}`);
    if (!isSidebarOpen && window.innerWidth < 768) { // Close sidebar on mobile after selection
      toggleSidebar();
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    // Add a confirmation dialog here in a real app
    if (window.confirm(`您确定要删除这个对话吗？此操作无法撤销。`)) {
      deleteChatSession(sessionId);
      if (activeChatId === sessionId) {
        // If active chat is deleted, navigate to a new chat or the next available one
        const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          router.push(`/chat/${remainingSessions[0].id}`);
        } else {
          const newSession = createChatSession(TEMP_USER_ID);
          router.push(`/chat/${newSession.id}`);
        }
      }
    }
  };
  
  const handleRenameChat = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
    e.stopPropagation();
    const newTitle = prompt("输入新的对话标题:", currentTitle);
    if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
      updateChatSessionTitle(sessionId, newTitle.trim());
    }
  };


  if (!isSidebarOpen) {
    // Optionally render a button to open the sidebar if it's closed,
    // or handle this in the main layout. For now, it just won't render if closed.
    // This logic might be better in the parent layout component.
    return null;
  }

  // 折叠（极窄）模式
  if (isSidebarCollapsed) {
    return (
      <aside className="w-14 bg-gray-100 dark:bg-gray-900 p-2 flex flex-col h-full border-r border-accent items-center">
        <Button
          onClick={handleCreateNewChat}
          variant="ghost"
          size="icon"
          className="mb-2"
          title="新对话"
        >
          <PlusCircle size={22} />
        </Button>
        <div className="flex-grow flex flex-col items-center justify-center">
          {/* 可扩展：显示当前激活会话的图标 */}
        </div>
        <Button
          onClick={toggleSidebarCollapsed}
          variant="ghost"
          size="icon"
          className="mb-2"
          title="展开侧边栏"
        >
          <ChevronRight size={22} />
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon"
          title="设置"
          className="mb-2"
        >
          <a href="/providers">
            <Settings size={20} />
          </a>
        </Button>
      </aside>
    );
  }

  return (
    <aside className="w-64 md:w-72 bg-gray-100 dark:bg-gray-900 p-4 flex flex-col h-full border-r border-accent relative">
      {/* 折叠按钮 */}
      <Button
        onClick={toggleSidebarCollapsed}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10"
        title="折叠侧边栏"
      >
        <ChevronLeft size={22} />
      </Button>
      <Button
        onClick={handleCreateNewChat}
        variant="outline"
        className="w-full mb-4"
      >
        <PlusCircle size={18} className="mr-2" />
        新对话
      </Button>
      <div className="flex-grow overflow-y-auto space-y-2 pr-1 -mr-1"> {/* Negative margin for scrollbar */}
        {chatSessions.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((session) => (
          <Link
            href={`/chat/${session.id}`}
            key={session.id}
            onClick={() => {
              setActiveChatId(session.id);
              if (window.innerWidth < 768) toggleSidebar(); // Close on mobile
            }}
            className={classNames(
              "flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 group",
              {
                "bg-primary/20 dark:bg-primary/30 text-primary-foreground": activeChatId === session.id,
                "text-gray-700 dark:text-gray-300": activeChatId !== session.id,
              }
            )}
          >
            <div className="flex items-center overflow-hidden">
              <MessageSquareText size={18} className="mr-2 shrink-0" />
              <span className="truncate text-sm">{session.title}</span>
            </div>
            <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" title="重命名" onClick={(e) => handleRenameChat(e, session.id, session.title)}>
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="删除" onClick={(e) => handleDeleteChat(e, session.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Link>
        ))}
        {chatSessions.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            还没有对话。点击“新对话”开始吧！
          </p>
        )}
      </div>
      {/* Settings Link */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/providers" // Or a general /settings landing page if created
          onClick={() => {
            if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); // Close on mobile
          }}
          className="flex items-center p-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Settings size={18} className="mr-3" />
          设置
        </Link>
      </div>
      {/* Optional: User settings / profile link at the bottom */}
    </aside>
  );
};

export default ChatSidebar;