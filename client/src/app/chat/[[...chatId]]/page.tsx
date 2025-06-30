"use client";

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/Common/Button';
import type { Message as MessageType } from '@/types/chat';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';

const ChatDetailPanel = dynamic(() => import('@/components/Chat/ChatDetailPanel'), { ssr: false });

const TEMP_USER_ID = "user-123";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatIdFromParams = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const [hydrated, setHydrated] = React.useState(false);

  const {
    activeChatId,
    setActiveChatId,
    createChatSession,
    loadChatSession,
    getActiveChatMessages,
    updateMessage,
    deleteMessage: deleteMessageFromStore,
    setLoading: setChatLoading,
    setError: setChatError,
    isLoading: isChatLoading,
    handleSendMessage, // Get the action from the store
  } = useChatStore();

  const { appSettings } = useSettingsStore();
  const {
    isChatDetailPanelOpen,
    setChatDetailPanelOpen,
    toggleChatDetailPanel
  } = useUIStore();

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const store = useChatStore.getState();

    if (chatIdFromParams) {
      if (chatIdFromParams !== store.activeChatId) {
        if (store.chatSessions.some(s => s.id === chatIdFromParams)) {
          loadChatSession(chatIdFromParams);
        } else {
          console.warn(`Chat session with ID ${chatIdFromParams} not found. Redirecting.`);
          const validSessionId = store.activeChatId && store.chatSessions.some(s => s.id === store.activeChatId)
            ? store.activeChatId
            : store.chatSessions.length > 0
              ? [...store.chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].id
              : null;
          
          if (validSessionId) {
            router.replace(`/chat/${validSessionId}`, { scroll: false });
          } else {
            const newSession = createChatSession(TEMP_USER_ID, "新对话 1", appSettings.defaultModelId);
            router.replace(`/chat/${newSession.id}`, { scroll: false });
          }
        }
      }
    } else {
      const validSessionId = store.activeChatId && store.chatSessions.some(s => s.id === store.activeChatId)
        ? store.activeChatId
        : store.chatSessions.length > 0
          ? [...store.chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].id
          : null;

      if (validSessionId) {
        router.replace(`/chat/${validSessionId}`, { scroll: false });
      } else {
        const newSession = createChatSession(TEMP_USER_ID, "新对话 1", appSettings.defaultModelId);
        router.replace(`/chat/${newSession.id}`, { scroll: false });
      }
    }
  }, [hydrated, chatIdFromParams, router, loadChatSession, createChatSession, appSettings.defaultModelId]);

  const messages = useMemo(() => {
    if (!hydrated || !activeChatId) return [];
    return getActiveChatMessages();
  }, [hydrated, activeChatId, getActiveChatMessages, useChatStore.getState().messages[activeChatId || ""]]);

  const activeSession = useChatStore(state => {
    if (!hydrated || !state.activeChatId) return null;
    return state.chatSessions.find(s => s.id === state.activeChatId);
  });

  const handleCopyMessage = async (content: string) => {
    if (!navigator.clipboard) {
      toast.error("浏览器不支持复制功能或页面非 HTTPS。");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      toast.success("消息内容已复制到剪贴板！");
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error("复制失败，请重试。");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (activeChatId) {
      deleteMessageFromStore(activeChatId, messageId);
      toast.info("消息已删除。");
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeChatId) return;

    const chatStore = useChatStore.getState();
    const messagesInActiveChat = chatStore.messages[activeChatId] || [];
    const messageIndex = messagesInActiveChat.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      toast.error("未找到要编辑的消息。");
      return;
    }

    const originalMessage = messagesInActiveChat[messageIndex];
    if (originalMessage.content === newContent) {
      toast.info("消息内容未更改。");
      return;
    }

    const historyForApi = messagesInActiveChat.slice(0, messageIndex).map(m => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    }));
    historyForApi.push({
      role: "user",
      content: newContent,
      tool_calls: undefined,
      tool_call_id: undefined,
    });

    chatStore.updateMessage(activeChatId, messageId, { content: newContent, isLoading: false, error: undefined });
    
    const messagesToRemove = messagesInActiveChat.slice(messageIndex + 1);
    for (const msgToRemove of messagesToRemove) {
      chatStore.deleteMessage(activeChatId, msgToRemove.id);
    }
    
    toast.info("消息已更新，正在重新获取AI响应...");
    await handleSendMessage("", undefined, historyForApi);
  };

  const handleResendMessage = async (messageId: string) => {
    if (!activeChatId) return;

    const chatStore = useChatStore.getState();
    const messagesInActiveChat = chatStore.messages[activeChatId] || [];
    const messageIndex = messagesInActiveChat.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      toast.error("未找到要重新生成的消息。");
      return;
    }

    const messageToResend = messagesInActiveChat[messageIndex];
    if (messageToResend.role !== 'assistant') {
      toast.info("只能重新生成助手的消息。");
      return;
    }

    const historyForApi = messagesInActiveChat.slice(0, messageIndex).map(m => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    }));

    const messagesToRemove = messagesInActiveChat.slice(messageIndex);
    for (const msgToRemove of messagesToRemove) {
      chatStore.deleteMessage(activeChatId, msgToRemove.id);
    }
    
    toast.info("正在重新生成AI响应...");
    await handleSendMessage("", undefined, historyForApi);
  };

  const handleBranchMessage = (messageId: string) => {
    if (!activeChatId || !activeSession) {
      toast.error("没有活动的会话来创建分支。");
      return;
    }

    const chatStore = useChatStore.getState();
    const messagesInActiveChat = chatStore.messages[activeChatId] || [];
    const messageIndex = messagesInActiveChat.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      toast.error("未找到用于创建分支的消息。");
      return;
    }

    const messagesForNewSession = messagesInActiveChat
      .slice(0, messageIndex + 1)
      .map(msg => ({ ...msg, id: uuidv4(), createdAt: new Date() }));

    const newSessionTitle = `${activeSession.title || "新对话"} (分支)`;
    
    const newSession = chatStore.createChatSession(
      TEMP_USER_ID,
      newSessionTitle,
      activeSession.modelId
    );

    chatStore.setMessages(newSession.id, messagesForNewSession);
    
    chatStore.updateChatSessionSettings(newSession.id, {
      modelId: activeSession.modelId,
      temperature: activeSession.temperature,
      systemPrompt: activeSession.systemPrompt,
      maxTokens: activeSession.maxTokens,
      topP: activeSession.topP,
      enabledMcpServers: activeSession.enabledMcpServers ? [...activeSession.enabledMcpServers] : undefined,
    });

    toast.success(`已创建分支会话: ${newSessionTitle}`);
    
    router.push(`/chat/${newSession.id}`);
  };

  if (!hydrated) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center p-4">
          <p>正在加载聊天记录...</p>
        </div>
        <div className="p-4 border-t border-accent bg-background">
            <div className="flex items-end space-x-2">
                <div className="h-10 w-10 rounded-md border flex items-center justify-center opacity-50"></div>
                <div className="flex-grow h-10 rounded-md border opacity-50"></div>
                <div className="h-10 w-10 rounded-md border flex items-center justify-center opacity-50"></div>
            </div>
        </div>
      </div>
    );
  }
  
  if (!activeSession) {
      return (
        <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-4">
                <p>没有活动的对话。请创建一个新对话。</p>
            </div>
            <MessageInput onSendMessage={() => {}} isLoading={true} />
        </div>
      );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeSession && (
          <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-background/95 backdrop-blur-sm sticky top-0 z-10 shrink-0">
            <div className="flex items-center min-w-0 space-x-2">
              <Link href="/">
                <Button variant="ghost" size="icon" title="返回主页">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold truncate" title={activeSession.title}>
                {activeSession.title || "新对话"}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {!isChatDetailPanelOpen && (
                <Button variant="ghost" size="icon" onClick={toggleChatDetailPanel} title="聊天设置与详情">
                  <Settings size={20} />
                </Button>
              )}
            </div>
          </header>
        )}
        <div className="flex-grow overflow-y-auto">
          <ChatWindow
            messages={messages}
            currentUserId={TEMP_USER_ID}
            isLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            onCopyMessage={handleCopyMessage}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onResendMessage={handleResendMessage}
            onBranchMessage={handleBranchMessage}
          />
        </div>
      </main>

      <div
        className={`fixed right-0 top-0 h-full z-30 transition-transform duration-300 ease-in-out
          ${isChatDetailPanelOpen ? "translate-x-0" : "translate-x-full"}
          w-80 md:w-96`}
        style={{ willChange: "transform" }}
      >
        <ChatDetailPanel
          isOpen={isChatDetailPanelOpen}
          onClose={() => setChatDetailPanelOpen(false)}
          activeChatSession={activeSession}
        />
      </div>
    </div>
  );
}