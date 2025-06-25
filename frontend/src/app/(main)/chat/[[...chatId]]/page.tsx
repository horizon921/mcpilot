"use client";

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput'; // Re-add MessageInput import
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore'; // Import useUIStore
import { Button } from '@/components/Common/Button'; // Import Button component
import type { Message as MessageType } from '@/types/chat'; // Renamed to avoid conflict with React's Message type
import { toast } from "sonner"; // For copy feedback
import { v4 as uuidv4 } from 'uuid';
import { Settings } from 'lucide-react'; // Import Settings icon for the new button
import dynamic from 'next/dynamic';

const ChatDetailPanel = dynamic(() => import('@/components/Chat/ChatDetailPanel'), { ssr: false });

// A placeholder for a user ID, in a real app this would come from auth
const TEMP_USER_ID = "user-123";
const TEMP_USER_PROFILE = { id: TEMP_USER_ID, name: "Current User" };


export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatIdFromParams = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const [hasMounted, setHasMounted] = React.useState(false);

  const {
    activeChatId,
    setActiveChatId,
    createChatSession,
    loadChatSession,
    getActiveChatMessages,
    addOptimisticMessage,
    updateMessage,
    deleteMessage: deleteMessageFromStore, // Get deleteMessage action
    setLoading: setChatLoading,
    setError: setChatError,
    isLoading: isChatLoading,
  } = useChatStore();

  const { appSettings } = useSettingsStore();
  const { getApiKey } = useSettingsStore();
  const {
    isChatDetailPanelOpen,
    setChatDetailPanelOpen,
    toggleChatDetailPanel
  } = useUIStore();

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to handle chat session loading or creation based on URL
  useEffect(() => {
    if (!hasMounted) return;

    const store = useChatStore.getState(); // Get a consistent snapshot for this effect run

    if (chatIdFromParams) {
      // URL has a specific chat ID
      // Only call loadChatSession if the chatIdFromParams is different from the store's activeChatId
      // or if there's no activeChatId in store yet (e.g. initial load with a direct URL to a chat)
      if (chatIdFromParams !== store.activeChatId || !store.activeChatId) {
        if (store.chatSessions.some(s => s.id === chatIdFromParams)) {
          loadChatSession(chatIdFromParams); // This action will set the activeChatId in the store
        } else {
          // Invalid chatId in URL (e.g., bookmark to a deleted session)
          console.warn(`Chat session with ID ${chatIdFromParams} not found. Attempting to fall back.`);
          // Fallback strategy:
          if (store.activeChatId && store.chatSessions.some(s => s.id === store.activeChatId)) {
            // If there's a valid active session in store, redirect to it
            router.replace(`/chat/${store.activeChatId}`, { scroll: false });
          } else if (store.chatSessions.length > 0) {
            // If no valid active session, but other sessions exist, go to the most recent one
            const sortedSessions = [...store.chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            router.replace(`/chat/${sortedSessions[0].id}`, { scroll: false });
          } else {
            // No sessions at all, create a new one
            const newSession = createChatSession(TEMP_USER_ID, "新对话 1", appSettings.defaultModelId);
            router.replace(`/chat/${newSession.id}`, { scroll: false });
          }
        }
      }
      // If chatIdFromParams === store.activeChatId, it means the store is already aligned with the URL,
      // or loadChatSession was just called and will update the store, triggering a re-render.
      // No further action needed in this effect run for this case.
    } else {
      // No chatId in URL (e.g., user navigated to /chat or from settings "Return to Chat")
      if (store.activeChatId && store.chatSessions.some(s => s.id === store.activeChatId)) {
        // If a valid active chat ID exists in the store, navigate to it.
        router.replace(`/chat/${store.activeChatId}`, { scroll: false });
      } else if (store.chatSessions.length > 0) {
        // If no valid active chat, but other sessions exist, navigate to the most recent one.
        const sortedSessions = [...store.chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        router.replace(`/chat/${sortedSessions[0].id}`, { scroll: false });
      } else {
        // No active chat and no sessions at all, create a new one.
        const newSession = createChatSession(TEMP_USER_ID, "新对话 1", appSettings.defaultModelId);
        router.replace(`/chat/${newSession.id}`, { scroll: false });
      }
    }
  }, [hasMounted, chatIdFromParams, router, loadChatSession, createChatSession, appSettings.defaultModelId]); // Dependencies carefully chosen

  const messages = useMemo(() => {
    if (!hasMounted || !activeChatId) return []; // Return empty array if not mounted or no active chat
    return getActiveChatMessages(); // getActiveChatMessages already handles returning [] if activeChatId is null or messages[activeChatId] is undefined
  }, [hasMounted, activeChatId, getActiveChatMessages, useChatStore.getState().messages[activeChatId || ""]]); // Depend on specific messages of active chat

  const activeSession = useChatStore(state => {
    if (!hasMounted || !state.activeChatId) return null;
    return state.chatSessions.find(s => s.id === state.activeChatId); // More direct way to get active session
  });


  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    existingMessageHistory?: Partial<MessageType>[] // Changed to Partial<MessageType>[] for flexibility
  ) => {
    // Get the latest activeChatId and activeSession directly from the store at the beginning of the function
    // This ensures that even if the component's props/state haven't re-rendered yet,
    // we are using the most current values from the Zustand store.
    const currentActiveChatId = useChatStore.getState().activeChatId;
    const currentActiveSession = useChatStore.getState().getActiveChatSession(); // Assumes getActiveChatSession() is a selector that derives from state

    if (!currentActiveChatId || !currentActiveSession) {
      toast.error("没有活动的聊天会话或会话信息不完整。");
      setChatLoading(false); // Ensure loading is stopped if we exit early
      return;
    }

    let tempMessageId: string | null = null;
    let messageHistoryForApi: Partial<MessageType>[];
    const chatStore = useChatStore.getState(); // Get a snapshot of the store for consistent use within this call

    if (existingMessageHistory) {
      // If existingMessageHistory is provided (e.g., for tool call follow-ups or resends), use it.
      // Make a shallow copy to avoid mutating the original array if it's passed from state.
      messageHistoryForApi = [...existingMessageHistory];
      // If new 'content' is also provided, it means we're adding a new user message to this existing history.
      // This could happen if a user edits a message that previously led to tool calls, and now we're resending.
      if (content && content.trim() !== "") { // Ensure content is not just whitespace
        messageHistoryForApi.push({ role: "user", content, tool_calls: undefined, tool_call_id: undefined });
      }
    } else {
      // This is a new user message submission.
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        toast.info("请输入消息或添加附件。");
        return; // Don't send empty messages
      }
      // Add the new user message optimistically.
      tempMessageId = chatStore.addOptimisticMessage(currentActiveChatId, content, "user", TEMP_USER_PROFILE);
      // Get the full message history *after* adding the optimistic message.
      messageHistoryForApi = chatStore.getActiveChatMessages().map(m => ({
        role: m.role,
        content: m.content,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
      }));
    }
    
    setChatLoading(true);
    setChatError(null);

    // These variables will hold the state for the *current* streaming response being processed.
    // They are crucial for correctly accumulating content for a single assistant message,
    // especially if multiple stream responses occur (e.g., initial response, then tool call, then final response).
    let currentStreamAssistantMessageId: string | null = null;
    let currentStreamAccumulatedContent = "";

    try {
      const modelEntryIdToUse = currentActiveSession.modelId || appSettings.defaultModelId;
      if (!modelEntryIdToUse) {
        toast.error("没有在当前会话中指定模型，也没有配置全局默认模型。请检查聊天设置或应用设置。");
        setChatLoading(false);
        return;
      }

      const settingsStore = useSettingsStore.getState();
      const selectedModel = settingsStore.getModelById(modelEntryIdToUse);

      if (!selectedModel) {
        toast.error(`模型配置 (ID: ${modelEntryIdToUse}) 未找到。请检查您的模型设置。`);
        setChatLoading(false);
        return;
      }

      if (!selectedModel.modelNativeId) {
        toast.error(`模型 "${selectedModel.name}" (ID: ${selectedModel.id}) 缺少必要的“原生模型 ID”。请在设置中更新此模型的配置。`);
        setChatLoading(false);
        return;
      }

      const selectedProvider = settingsStore.getProviderById(selectedModel.providerId);

      if (!selectedProvider) {
        toast.error(`模型 "${selectedModel.name}" 指定的服务商 (ID: ${selectedModel.providerId}) 未找到。请检查您的服务商设置。`);
        setChatLoading(false);
        return;
      }
      
      const requestBody = {
        chatId: currentActiveChatId,
        messages: messageHistoryForApi,
        modelNativeId: selectedModel.modelNativeId, // Use the native model ID for the API
        providerId: selectedProvider.id,          // Our app's unique ID for the provider entry
        providerType: selectedProvider.type,      // The type of the provider (e.g., "openai", "anthropic")
        baseUrl: selectedProvider.baseUrl,        // The baseUrl from the provider entry in settings
        temperature: currentActiveSession.temperature,
        systemPrompt: currentActiveSession.systemPrompt,
        maxTokens: currentActiveSession.maxTokens,
        topP: currentActiveSession.topP,
        clientProvidedApiKey: settingsStore.getApiKey(selectedProvider.id) || undefined,
        stop: currentActiveSession.stopSequences && currentActiveSession.stopSequences.length > 0 ? currentActiveSession.stopSequences : undefined,
        jsonSchema: currentActiveSession.jsonSchema,
        enableInputPreprocessing: appSettings.enableInputPreprocessing,
      };
      
      console.log("Sending request to /api/chat/stream with body:", requestBody);


      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // If there was an optimistic message, mark it as no longer loading (i.e., sent to backend).
      if (tempMessageId && currentActiveChatId) { // Check currentActiveChatId again in case it changed
        chatStore.updateMessage(currentActiveChatId, tempMessageId, { isLoading: false });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API 请求失败，状态码: ${response.status}` }));
        throw new Error(errorData.message || `API 错误: ${response.status}`);
      }
      if (!response.body) throw new Error('API 响应体为空');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Stream processing loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Stream finished
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const jsonString = line.substring('data: '.length);
          try {
            const parsedChunk = JSON.parse(jsonString) as import('@/types/api').ChatStreamChunk;
            
            // CRITICAL: Always get the freshest state from the store inside the loop,
            // especially before any async operations or state updates.
            // This helps prevent issues if the user switches chats during a stream.
            const freshChatStore = useChatStore.getState();
            const freshActiveChatId = freshChatStore.activeChatId;

            // If the active chat has changed since this stream started, abort processing for this (old) stream.
            if (!freshActiveChatId || freshActiveChatId !== currentActiveChatId) {
                console.warn("Chat session changed during stream. Aborting processing for the old stream.");
                if (!done) await reader.cancel().catch(e => console.error("Error cancelling reader:", e)); // Attempt to cancel the reader
                return; // Exit handleSendMessage for this old stream
            }

            if (parsedChunk.type === 'message_start' && parsedChunk.message) {
              currentStreamAssistantMessageId = parsedChunk.message.id;
              currentStreamAccumulatedContent = ""; // Reset for this new assistant message
              freshChatStore.addMessage(freshActiveChatId, {
                id: currentStreamAssistantMessageId,
                role: 'assistant',
                content: "", // Start with empty content
                createdAt: new Date(parsedChunk.message.createdAt),
                isLoading: true,
              });
            } else if (parsedChunk.type === 'content_delta' && parsedChunk.content && currentStreamAssistantMessageId) {
              currentStreamAccumulatedContent += parsedChunk.content;
              freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                content: currentStreamAccumulatedContent,
              });
            } else if (parsedChunk.type === 'tool_calls' && parsedChunk.tool_calls && currentStreamAssistantMessageId) {
              // Update the current assistant message with the tool calls and any content received so far.
              freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                tool_calls: parsedChunk.tool_calls,
                content: currentStreamAccumulatedContent, // Persist content accumulated before tool_calls
                isLoading: false, // This part of the assistant's turn is done; now tools will run.
              });
              
              // IIFE to handle async tool call processing
              (async () => {
                const toolCallResultsPayload: Omit<MessageType, "id" | "createdAt" | "chatId">[] = [];
                for (const toolCall of parsedChunk.tool_calls!) {
                  let tcResultData: any;
                  let targetServer: import('@/types/mcp').MCPServerInfo | undefined;
                  
                  const settingsStore = useSettingsStore.getState();
                  const sessionMcpServerIds = currentActiveSession.enabledMcpServers;

                  if (sessionMcpServerIds && sessionMcpServerIds.length > 0) {
                    const sessionEnabledServers = sessionMcpServerIds
                      .map(id => settingsStore.getMCPServerById(id))
                      .filter(s => s && s.isEnabled && s.status === 'connected') as import('@/types/mcp').MCPServerInfo[];
                    if (sessionEnabledServers.length > 0) {
                      targetServer = sessionEnabledServers[0]; // Use first from session-specific list
                      console.log(`Using session-specific MCP server: ${targetServer.name} for tool call.`);
                    }
                  }

                  if (!targetServer) { // Fallback to global enabled servers
                    const globalEnabledMCPServers = settingsStore.getEnabledMCPServers();
                    if (globalEnabledMCPServers.length > 0) {
                      targetServer = globalEnabledMCPServers.filter(s => s.status === 'connected')[0]; // Use first connected from global list
                       if (targetServer) {
                        console.log(`Using global MCP server: ${targetServer.name} for tool call (session-specific not found or not connected).`);
                      }
                    }
                  }

                  if (!targetServer) {
                    tcResultData = { error: `错误：没有可用的或已连接的 MCP 服务来处理工具调用 "${toolCall.function.name}"。请检查会话或全局 MCP 设置。` };
                  } else {
                    try {
                      const mcpResp = await fetch('/api/mcp/call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          serverId: targetServer.id,
                          serverBaseUrl: targetServer.baseUrl,
                          toolName: toolCall.function.name,
                          arguments: JSON.parse(toolCall.function.arguments), // Assuming arguments is a JSON string
                          authConfig: targetServer.authConfig, // Pass authentication configuration
                        }),
                      });
                      const mcpResJson = await mcpResp.json() as import('@/types/mcp').MCPCallApiResponse;
                      tcResultData = mcpResJson.success ? mcpResJson.data : { error: mcpResJson.error || "MCP 工具调用失败" };
                    } catch (e: any) { tcResultData = { error: e.message || "调用 MCP 代理出错" }; }
                  }
                  toolCallResultsPayload.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(tcResultData) });
                }
                
                // CRITICAL: Re-check active chat ID before adding tool results and resending.
                const stillActiveChatIdForToolResults = useChatStore.getState().activeChatId;
                if (stillActiveChatIdForToolResults === freshActiveChatId) { // Ensure chat hasn't changed
                    // Add all tool result messages to the store.
                    toolCallResultsPayload.forEach(tm => useChatStore.getState().addMessage(stillActiveChatIdForToolResults!, tm));
                    
                    // Get the latest history, which now includes the assistant's tool_calls message and the tool_result messages.
                    const historyWithToolResults = useChatStore.getState().getActiveChatMessages();
                    
                    // Recursively call handleSendMessage to send the history (with tool results) back to the AI.
                    // Pass null for content, as we are not adding a new user message here.
                    await handleSendMessage("", undefined, historyWithToolResults);
                } else {
                     console.warn("Chat session changed before tool results could be processed and resent.");
                     // If chat changed, we might not want to set global loading to false here,
                     // as the new chat's loading state will be managed independently.
                     // However, for the *current* (old) chat context, this flow is ending.
                     setChatLoading(false); // Stop loading for this (now old) chat context
                }
              })();
              // Since the IIFE is async and will initiate a new `handleSendMessage` call,
              // we should exit the current stream processing loop. The server also typically closes
              // the stream after sending tool_calls.
              return; // Exit the `while (true)` loop and `handleSendMessage` for this stream.
            
            } else if (parsedChunk.type === 'message_end' && currentStreamAssistantMessageId) {
              // Final update for the current assistant message.
              const finalMsgStore = freshChatStore.messages[freshActiveChatId];
              const finalMsg = finalMsgStore?.find(m => m.id === currentStreamAssistantMessageId);
              
              freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                isLoading: false,
                content: currentStreamAccumulatedContent, // Ensure final accumulated content is set
              });

              // Only stop the global loading indicator if this message_end is not part of a tool_call flow
              // (because the tool_call flow will manage its own loading state via the recursive call).
              if (!finalMsg?.tool_calls || finalMsg.tool_calls.length === 0) {
                setChatLoading(false);
              }
              currentStreamAssistantMessageId = null; // Reset for the next potential message in the same stream (if any)
              currentStreamAccumulatedContent = "";
            } else if (parsedChunk.type === 'error' && parsedChunk.error) {
              const errorMsg = `${parsedChunk.error.message}${parsedChunk.error.details ? ` (详情: ${parsedChunk.error.details})` : ''}`;
              if (currentStreamAssistantMessageId && freshActiveChatId) { // Check freshActiveChatId
                freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, { error: errorMsg, isLoading: false });
              } else {
                // If no specific assistant message to attach error to, set global chat error.
                setChatError(errorMsg);
              }
              setChatLoading(false);
            }
          } catch (e) {
            console.error("解析流块时出错:", e, "块:", jsonString);
            setChatError("解析响应数据时出错");
            setChatLoading(false); // Stop loading on parse error
          }
        }
      }
    } catch (error: any) {
      console.error("发送消息或处理流时出错:", error);
      const finalActiveChatIdOnError = useChatStore.getState().activeChatId; // Get latest active chat ID
      if (tempMessageId && finalActiveChatIdOnError) { // If it was an optimistic message
        useChatStore.getState().updateMessage(finalActiveChatIdOnError, tempMessageId, { error: error.message || "发送失败", isLoading: false });
      }
      setChatError(error.message || "获取 AI 响应失败");
      setChatLoading(false); // Ensure loading is stopped on any error
    }
    // Removed finally block for setChatLoading(false) as it's handled in more specific places.
  };

  // Render loading states or ChatWindow based on hasMounted and activeSession
  if (!hasMounted) {
    // Consistent loading state for server and initial client render before hydration
    // This should include the MessageInput structure if ChatWindow always renders it.
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center p-4">
          <p>正在加载聊天记录...</p>
        </div>
        {/* Placeholder for MessageInput to match structure */}
        <div className="p-4 border-t border-accent bg-background">
            <div className="flex items-end space-x-2">
                <div className="h-10 w-10 rounded-md border flex items-center justify-center opacity-50"></div> {/* Placeholder for button */}
                <div className="flex-grow h-10 rounded-md border opacity-50"></div> {/* Placeholder for textarea */}
                <div className="h-10 w-10 rounded-md border flex items-center justify-center opacity-50"></div> {/* Placeholder for button */}
            </div>
        </div>
      </div>
    );
  }

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
      // Optional: Add a confirmation dialog here
      // if (window.confirm("确定要删除这条消息吗?")) {
        deleteMessageFromStore(activeChatId, messageId);
        toast.info("消息已删除。");
      // }
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

    // Strategy: Truncate history up to the edited message, update it, then resend.
    // 1. Create the history to be sent to the API
    const historyForApi = messagesInActiveChat.slice(0, messageIndex).map(m => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    }));
    // Add the edited user message
    historyForApi.push({
      role: "user", // Assuming only user messages are editable this way
      content: newContent,
      tool_calls: undefined, // Explicitly set to undefined
      tool_call_id: undefined, // Explicitly set to undefined
    });

    // 2. Update the store:
    //    a. Update the content of the edited message.
    //    b. Remove all messages after the edited one.
    chatStore.updateMessage(activeChatId, messageId, { content: newContent, isLoading: false, error: undefined });
    
    const messagesToRemove = messagesInActiveChat.slice(messageIndex + 1);
    for (const msgToRemove of messagesToRemove) {
      chatStore.deleteMessage(activeChatId, msgToRemove.id); // Assuming deleteMessage is synchronous or we don't need to await it here
    }
    
    toast.info("消息已更新，正在重新获取AI响应...");
    // 3. Call handleSendMessage with the new history.
    //    The `handleSendMessage` function will set its own loading state.
    //    The `content` parameter for handleSendMessage will be empty as the new user message is already in `historyForApi`.
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
      toast.info("只能重新生成助手的消息。"); // Changed from toast.warn to toast.info
      return;
    }

    // 1. Get history up to (but not including) the message to be resent.
    const historyForApi = messagesInActiveChat.slice(0, messageIndex).map(m => ({
      role: m.role,
      content: m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
    }));

    // 2. Remove the message to be resent and all subsequent messages from the store.
    const messagesToRemove = messagesInActiveChat.slice(messageIndex);
    for (const msgToRemove of messagesToRemove) {
      chatStore.deleteMessage(activeChatId, msgToRemove.id);
    }
    
    toast.info("正在重新生成AI响应...");
    // 3. Call handleSendMessage with the truncated history.
    //    The `handleSendMessage` function will handle adding the new assistant message.
    //    The `content` parameter is empty as we are not adding a new user message.
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

    // 1. Prepare messages for the new session (up to and including the branch point)
    const messagesForNewSession = messagesInActiveChat
      .slice(0, messageIndex + 1)
      .map(msg => ({ ...msg, id: uuidv4(), createdAt: new Date() })); // Create new IDs and reset createdAt for messages in new session

    // 2. Create a new chat session title
    const newSessionTitle = `${activeSession.title || "新对话"} (分支)`;
    
    // 3. Create the new session (without initial messages yet)
    const newSession = chatStore.createChatSession(
      TEMP_USER_ID,
      newSessionTitle,
      activeSession.modelId // Inherit modelId
    );

    // 4. Set messages for the new session
    chatStore.setMessages(newSession.id, messagesForNewSession);
    
    // 5. Update other settings from the original session to the new session
    chatStore.updateChatSessionSettings(newSession.id, {
      modelId: activeSession.modelId, // Ensure modelId is part of settings if createChatSession doesn't set it fully
      temperature: activeSession.temperature,
      systemPrompt: activeSession.systemPrompt,
      maxTokens: activeSession.maxTokens,
      topP: activeSession.topP,
      enabledMcpServers: activeSession.enabledMcpServers ? [...activeSession.enabledMcpServers] : undefined,
      // any other settings to inherit
    });

    toast.success(`已创建分支会话: ${newSessionTitle}`);
    
    // 3. Navigate to the new session
    // setActiveChatId(newSession.id); // This will be handled by the useEffect watching route params
    router.push(`/chat/${newSession.id}`);
  };


  if (!activeChatId && !chatIdFromParams) {
    // Still determining chat or creating new one after mount (should be handled by useEffect to redirect/create)
     return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center p-4">
          <p>正在创建或加载对话...</p>
        </div>
         <MessageInput onSendMessage={() => {}} isLoading={true} />
      </div>
    );
  }
  
  // If chatIdFromParams is present but activeSession is not yet loaded (or invalid)
  if (chatIdFromParams && !activeSession) {
     return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center p-4">
          <p>加载聊天会话 {chatIdFromParams}...</p>
        </div>
         <MessageInput onSendMessage={() => {}} isLoading={true} />
      </div>
    );
  }
  
  // If somehow activeChatId is set, but the session itself isn't found (e.g., deleted then navigated back)
  if (activeChatId && !activeSession) {
     return (
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center p-4">
          <p>无法加载对话 {activeChatId}。可能已被删除或ID无效。</p>
        </div>
        <MessageInput onSendMessage={() => {}} isLoading={true} />
      </div>
    );
  }
  
  // If no active session could be determined (e.g. after deleting all chats)
  // This case should ideally be handled by the useEffect creating a new chat and redirecting.
  // If it still reaches here, it's an edge case.
  if (!activeSession) {
      return (
        <div className="flex flex-col h-full">
            <div className="flex-grow flex items-center justify-center p-4">
                <p>没有活动的对话。请创建一个新对话。</p>
                {/* Optionally, a button to create new chat if sidebar isn't visible */}
            </div>
            <MessageInput onSendMessage={() => {}} isLoading={true} />
        </div>
      );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background"> {/* Parent flex container (row) */}
      {/* TODO: Left Resizable Sidebar will go here (Problem 2d) */}
      
      <main className="flex-1 flex flex-col h-full overflow-hidden"> {/* Main Chat Content Area */}
        {activeSession && (
          <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-background/95 backdrop-blur-sm sticky top-0 z-10 shrink-0">
            <div className="flex items-center min-w-0 space-x-2">
              {/* TODO: Add button for left sidebar toggle here */}
              <h1 className="text-lg font-semibold truncate" title={activeSession.title}>
                {activeSession.title || "新对话"}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Button to toggle ChatDetailPanel */}
              <Button variant="ghost" size="icon" onClick={toggleChatDetailPanel} title="聊天设置与详情">
                <Settings size={20} />
              </Button>
            </div>
          </header>
        )}
        <div className="flex-grow overflow-y-auto"> {/* ChatWindow container */}
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
        {/* MessageInput 由 ChatWindow 内部唯一渲染，避免重复 */}
      </main>

      {/* Right Chat Detail Panel */}
      {isChatDetailPanelOpen && (
        <ChatDetailPanel
          isOpen={isChatDetailPanelOpen}
          onClose={() => setChatDetailPanelOpen(false)}
          activeChatSession={activeSession}
        />
      )}
    </div>
  );
}