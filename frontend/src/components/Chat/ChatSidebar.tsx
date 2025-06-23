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
    return null;
  }

  return (
    <aside className={classNames(
      "bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col h-full border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out",
      {
        "w-72 p-4": !isSidebarCollapsed,
        "w-16 p-2 items-center": isSidebarCollapsed,
      }
    )}>
      {/* Header */}
      <div className={classNames("flex items-center mb-4", { "justify-between": !isSidebarCollapsed, "justify-center": isSidebarCollapsed })}>
        {!isSidebarCollapsed && <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">对话列表</h1>}
        <Button
          onClick={handleCreateNewChat}
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-primary"
          title="新对话"
        >
          <PlusCircle size={22} />
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-grow overflow-y-auto space-y-1">
        {chatSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((session) => (
          <Link
            href={`/chat/${session.id}`}
            key={session.id}
            onClick={() => {
              setActiveChatId(session.id);
              if (window.innerWidth < 768) toggleSidebar();
            }}
            title={session.title}
            className={classNames(
              "flex items-center justify-between p-2 rounded-lg group transition-colors duration-150",
              {
                "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300": activeChatId === session.id,
                "hover:bg-gray-200/70 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300": activeChatId !== session.id,
                "justify-center": isSidebarCollapsed,
              }
            )}
          >
            <div className="flex items-center overflow-hidden">
              <MessageSquareText size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate text-sm ml-3">{session.title}</span>}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" title="重命名" onClick={(e) => handleRenameChat(e, session.id, session.title)}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" title="删除" onClick={(e) => handleDeleteChat(e, session.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </Link>
        ))}
        {chatSessions.length === 0 && !isSidebarCollapsed && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            点击 "+" 开始新对话
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-1">
          <Link
            href="/providers"
            onClick={() => { if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar(); }}
            className={classNames(
              "flex items-center p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-800/60",
              { "justify-center": isSidebarCollapsed }
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!isSidebarCollapsed && <span className="ml-3">设置</span>}
          </Link>
          <Button
            onClick={toggleSidebarCollapsed}
            variant="ghost"
            className={classNames(
              "w-full flex items-center p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-800/60",
              { "justify-center": isSidebarCollapsed }
            )}
            title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isSidebarCollapsed && <span className="ml-3">{isSidebarCollapsed ? "" : "折叠"}</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;