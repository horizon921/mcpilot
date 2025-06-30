import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { toast } from "sonner";
import { useSettingsStore } from './settingsStore';
import type { Message, ChatSession, UserProfile, ToolCall, MessageRole, ContentPart } from '@/types/chat';
import type { AIModel } from '@/types/config'; // Assuming we might store model info per chat

// --- Helper Functions (Consider moving to a utils file if they grow) ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const TEMP_USER_ID = "user-123";
const TEMP_USER_PROFILE = { id: TEMP_USER_ID, name: "Current User" };

// --- Store Definition ---
export interface ChatStoreState {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  messages: Record<string, Message[]>; // chatId -> messages array
  isLoading: boolean; // Global loading state for AI responses for the active chat
  error: string | null; // Global error state for the active chat
  currentEditingMessageId: string | null; // For message editing UI

  // --- Chat Session Actions ---
  createChatSession: (userId: string, title?: string, modelId?: string) => ChatSession;
  loadChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
  updateChatSessionTitle: (sessionId: string, newTitle: string) => void;
  updateChatSessionSettings: (
    sessionId: string,
    settings: Partial<Pick<
      ChatSession,
      | "modelId"
      | "systemPrompt"
      | "temperature"
      | "topP"
      | "maxTokens"
      | "enabledMcpServers"
      | "stopSequences"
      | "presencePenalty"
      | "frequencyPenalty"
      | "structuredOutput"
      | "stream"
      | "logitBias"
      | "user"
      | "jsonSchema"
    >>
  ) => void;
  setActiveChatId: (sessionId: string | null) => void;
  getActiveChatSession: () => ChatSession | undefined;

  // --- Message Actions ---
  // Allow passing optional id and createdAt, ensure role and content (or tool_calls) are there
  addMessage: (chatId: string, message: Partial<Omit<Message, "chatId">> & Pick<Message, "role"> & { content: string | null }) => Message;
  addOptimisticMessage: (chatId: string, messageContent: string, role?: MessageRole, user?: UserProfile) => string; // Returns tempId
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  clearChatMessages: (chatId: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void; // For loading messages from backend
  
  // --- Loading and Error State Actions ---
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // --- Editing State ---
  setCurrentEditingMessageId: (messageId: string | null) => void;

  // --- Utility to get messages for active chat ---
  getActiveChatMessages: () => Message[];

  // --- Core message sending logic ---
  handleSendMessage: (
    content: string,
    attachments?: File[],
    existingMessageHistory?: Partial<Message>[]
  ) => Promise<void>;
}

export const useChatStore = create<ChatStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        chatSessions: [],
        activeChatId: null,
        messages: {},
        isLoading: false,
        error: null,
        currentEditingMessageId: null,

        // --- Chat Session Implementations ---
        createChatSession: (userId, title, modelId) => {
          const newSession: ChatSession = {
            id: generateId(),
            title: title || `新对话 ${get().chatSessions.length + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId,
            modelId: modelId, // Set initial model if provided
          };
          set((state) => ({
            chatSessions: [...state.chatSessions, newSession],
            messages: { ...state.messages, [newSession.id]: [] },
            activeChatId: newSession.id, // Optionally set as active
          }));
          return newSession;
        },
        loadChatSession: (sessionId) => {
          const sessionExists = get().chatSessions.some(s => s.id === sessionId);
          if (sessionExists) {
            set({ activeChatId: sessionId, isLoading: false, error: null });
            // Here you might trigger fetching messages for this session if not already loaded
          } else {
            console.warn(`Chat session ${sessionId} not found.`);
          }
        },
        deleteChatSession: (sessionId) => {
          set((state) => {
            const newSessions = state.chatSessions.filter(s => s.id !== sessionId);
            const newMessages = { ...state.messages };
            delete newMessages[sessionId];
            return {
              chatSessions: newSessions,
              messages: newMessages,
              activeChatId: state.activeChatId === sessionId ? (newSessions.length > 0 ? newSessions[0].id : null) : state.activeChatId,
            };
          });
        },
        updateChatSessionTitle: (sessionId, newTitle) => {
          set((state) => ({
            chatSessions: state.chatSessions.map(s =>
              s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date() } : s
            ),
          }));
        },
        updateChatSessionSettings: (sessionId, settings) => {
          set((state) => ({
            chatSessions: state.chatSessions.map(s =>
              s.id === sessionId ? { ...s, ...settings, updatedAt: new Date() } : s
            ),
          }));
        },
        setActiveChatId: (sessionId) => {
          set({ activeChatId: sessionId, isLoading: false, error: null });
        },
        getActiveChatSession: () => {
          const activeId = get().activeChatId;
          if (!activeId) return undefined;
          return get().chatSessions.find(s => s.id === activeId);
        },

        // --- Message Implementations ---
        addMessage: (chatId, messageData) => {
          // messageData now can have id and createdAt
          const newMessage: Message = {
            id: messageData.id || generateId(), // Use provided id or generate new
            chatId, // chatId is always from the first argument
            role: messageData.role,
            content: messageData.content,
            tool_calls: messageData.tool_calls,
            tool_call_id: messageData.tool_call_id,
            user: messageData.user,
            isLoading: messageData.isLoading,
            error: messageData.error,
            parentId: messageData.parentId,
            childrenIds: messageData.childrenIds,
            createdAt: messageData.createdAt ? new Date(messageData.createdAt) : new Date(), // Use provided createdAt or generate new
            updatedAt: messageData.updatedAt ? new Date(messageData.updatedAt) : undefined,
          };
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: [...(state.messages[chatId] || []), newMessage],
            },
          }));
          // Update chat session's updatedAt
          get().updateChatSessionSettings(chatId, {}); // Triggers updatedAt
          return newMessage;
        },
        addOptimisticMessage: (chatId, content, role = "user", user) => {
          const tempId = `optimistic-${generateId()}`;
          const optimisticMessage: Message = {
            id: tempId,
            chatId,
            role,
            content,
            createdAt: new Date(),
            isLoading: false, // 用户消息不应该显示为loading状态
            user: role === "user" ? user : undefined,
          };
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: [...(state.messages[chatId] || []), optimisticMessage],
            },
            isLoading: true, // Start global loading as AI will respond
          }));
          get().updateChatSessionSettings(chatId, {});
          return tempId;
        },
        updateMessage: (chatId, messageId, updates) => {
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).map(msg =>
                msg.id === messageId ? { ...msg, ...updates, updatedAt: new Date() } : msg
              ),
            },
          }));
          get().updateChatSessionSettings(chatId, {});
        },
        deleteMessage: (chatId, messageId) => {
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).filter(msg => msg.id !== messageId),
            },
          }));
          get().updateChatSessionSettings(chatId, {});
        },
        clearChatMessages: (chatId) => {
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: [],
            },
          }));
          get().updateChatSessionSettings(chatId, {});
        },
        setMessages: (chatId, newMessages) => {
           set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: newMessages,
            },
          }));
        },

        // --- Loading and Error State Implementations ---
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        // --- Editing State ---
        setCurrentEditingMessageId: (messageId) => set({ currentEditingMessageId: messageId }),
        
        getActiveChatMessages: () => {
          const activeId = get().activeChatId;
          if (!activeId) return [];
          return get().messages[activeId] || [];
        },

        handleSendMessage: async (content, attachments, existingMessageHistory) => {
          const {
            activeChatId: currentActiveChatId,
            getActiveChatSession: getActiveChatSession,
            setLoading: setChatLoading,
            setError: setChatError,
            addOptimisticMessage,
            updateMessage,
            addMessage,
            getActiveChatMessages,
          } = get();
          
          const currentActiveSession = getActiveChatSession();

          if (!currentActiveChatId || !currentActiveSession) {
            toast.error("没有活动的聊天会话或会话信息不完整。");
            setChatLoading(false);
            return;
          }

          let tempMessageId: string | null = null;
          let messageHistoryForApi: Partial<Message>[];

          if (existingMessageHistory) {
            messageHistoryForApi = [...existingMessageHistory];
            if (content && content.trim() !== "") {
              messageHistoryForApi.push({ role: "user", content, tool_calls: undefined, tool_call_id: undefined });
            }
          } else {
            if (!content.trim() && (!attachments || attachments.length === 0)) {
              toast.info("请输入消息或添加附件。");
              return;
            }

            const contentParts: ContentPart[] = [];
            if (content.trim()) {
              contentParts.push({ type: 'text', text: content.trim() });
            }

            if (attachments && attachments.length > 0) {
              const imagePromises = attachments
                .filter(file => file.type.startsWith('image/'))
                .map(file => {
                  return new Promise<ContentPart>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      resolve({
                        type: 'image',
                        src: e.target?.result as string,
                        mediaType: file.type,
                      });
                    };
                    reader.onerror = (err) => {
                      console.error("Failed to read file:", err);
                      reject(new Error("Failed to read file: " + file.name));
                    };
                    reader.readAsDataURL(file);
                  });
                });

              try {
                const imageParts = await Promise.all(imagePromises);
                contentParts.push(...imageParts);
              } catch (error) {
                toast.error("无法读取图片附件，请重试。");
                return;
              }
            }
            
            const messageContent = contentParts.length === 1 && contentParts[0].type === 'text'
            ? contentParts[0].text
            : contentParts;

            const optimisticContent = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
            tempMessageId = addOptimisticMessage(currentActiveChatId, optimisticContent, "user", TEMP_USER_PROFILE);
            messageHistoryForApi = getActiveChatMessages().map(m => ({
              role: m.role,
              content: m.content,
              tool_calls: m.tool_calls,
              tool_call_id: m.tool_call_id,
            }));
          }
          
          setChatLoading(true);
          setChatError(null);

          let currentStreamAssistantMessageId: string | null = null;
          let messageIdForToolUpdates: string | null = null;
          let currentStreamAccumulatedContent = "";
          let isFollowingUpAfterToolCalls = false;

          try {
            const settingsStore = useSettingsStore.getState();
            const modelEntryIdToUse = currentActiveSession.modelId || settingsStore.appSettings.defaultModelId;
            if (!modelEntryIdToUse) {
              toast.error("没有在当前会话中指定模型，也没有配置全局默认模型。请检查聊天设置或应用设置。");
              setChatLoading(false);
              return;
            }

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
              modelNativeId: selectedModel.modelNativeId,
              providerId: selectedProvider.id,
              providerType: selectedProvider.type,
              baseUrl: selectedProvider.baseUrl,
              temperature: currentActiveSession.temperature,
              systemPrompt: currentActiveSession.systemPrompt,
              maxTokens: currentActiveSession.maxTokens,
              topP: currentActiveSession.topP,
              stream: currentActiveSession.stream ?? true,
              clientProvidedApiKey: settingsStore.getApiKey(selectedProvider.id) || undefined,
              stop: currentActiveSession.stopSequences && currentActiveSession.stopSequences.length > 0 ? currentActiveSession.stopSequences : undefined,
              jsonSchema: currentActiveSession.structuredOutput ? currentActiveSession.jsonSchema : undefined,
              enableInputPreprocessing: settingsStore.appSettings.enableInputPreprocessing,
              enabledMcpServers: (() => {
                const sessionEnabledIds = currentActiveSession.enabledMcpServers;
                if (sessionEnabledIds && sessionEnabledIds.length > 0) {
                  return sessionEnabledIds
                    .map(id => settingsStore.getMCPServerById(id))
                    .filter(s => s && s.isEnabled && s.status === 'connected' && s.tools && s.tools.length > 0);
                }
                return [];
              })(),
            };
            
            console.log("Sending request to /api/chat/stream with body:", requestBody);

            const response = await fetch('/api/chat/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            if (tempMessageId && currentActiveChatId) {
              updateMessage(currentActiveChatId, tempMessageId, { isLoading: false });
            }

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: `API 请求失败，状态码: ${response.status}` }));
              const errorMessage = errorData.error || errorData.message || `API 错误: ${response.status}`;
              
              const errorAssistantMessage: Partial<Omit<Message, "chatId">> & Pick<Message, "role"> & { content: string | null } = {
                role: 'assistant',
                content: `抱歉，处理您的请求时遇到错误：${errorMessage}`,
                error: errorMessage,
                isLoading: false,
              };
              
              addMessage(currentActiveChatId, errorAssistantMessage);
              setChatLoading(false);
              return;
            }
            if (!response.body) throw new Error('API 响应体为空');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

              for (const line of lines) {
                const jsonString = line.substring('data: '.length);
                try {
                  const parsedChunk = JSON.parse(jsonString) as import('@/types/api').ChatStreamChunk;
                  
                  const freshChatStore = get();
                  const freshActiveChatId = freshChatStore.activeChatId;

                  if (!freshActiveChatId || freshActiveChatId !== currentActiveChatId) {
                      console.warn("Chat session changed during stream. Aborting processing for the old stream.");
                      if (!done) await reader.cancel().catch(e => console.error("Error cancelling reader:", e));
                      return;
                  }

                  if (parsedChunk.type === 'message_start' && parsedChunk.message) {
                    currentStreamAssistantMessageId = parsedChunk.message.id;
                    currentStreamAccumulatedContent = "";
                    freshChatStore.addMessage(freshActiveChatId, {
                      id: currentStreamAssistantMessageId,
                      role: 'assistant',
                      content: "",
                      createdAt: new Date(parsedChunk.message.createdAt),
                      isLoading: true,
                    });
                  } else if (parsedChunk.type === 'content_delta' && parsedChunk.content) {
                      if (isFollowingUpAfterToolCalls && !currentStreamAssistantMessageId) {
                          const newAssistantId = `ai-${Date.now()}`;
                          currentStreamAssistantMessageId = newAssistantId;
                          currentStreamAccumulatedContent = parsedChunk.content;
                          freshChatStore.addMessage(freshActiveChatId, {
                              id: newAssistantId,
                              role: 'assistant',
                              content: currentStreamAccumulatedContent,
                              isLoading: false,
                              createdAt: new Date(),
                          });
                      } else if (currentStreamAssistantMessageId) {
                          currentStreamAccumulatedContent += parsedChunk.content;
                          freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                              content: currentStreamAccumulatedContent,
                              isLoading: false,
                          });
                      }
                  } else if (parsedChunk.type === 'tool_calls' && parsedChunk.tool_calls && currentStreamAssistantMessageId) {
                    freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                      tool_calls: parsedChunk.tool_calls,
                      content: currentStreamAccumulatedContent,
                      isLoading: false,
                    });
                    
                    console.log('收到工具调用:', parsedChunk.tool_calls);
                    
                    messageIdForToolUpdates = currentStreamAssistantMessageId;
                    
                    currentStreamAssistantMessageId = null;
                    currentStreamAccumulatedContent = "";
                    isFollowingUpAfterToolCalls = true;

                  } else if (parsedChunk.type === 'thinking') {
                    if (currentStreamAssistantMessageId) {
                      freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                        isLoading: parsedChunk.thinking,
                      });
                    }
                  } else if (parsedChunk.type === 'tool_call_start') {
                    const messageToUpdateId = messageIdForToolUpdates;
                    if (messageToUpdateId && parsedChunk.tool_call_id) {
                      const toolCallStatus: import('@/types/chat').MCPToolCallStatus = {
                        tool_call_id: parsedChunk.tool_call_id,
                        tool_name: parsedChunk.tool_name || '未知工具',
                        server_name: parsedChunk.server_name || '未知服务器',
                        status: 'calling',
                        timestamp: new Date(),
                      };
                      
                      const currentMessage = freshChatStore.messages[freshActiveChatId]?.find(m => m.id === messageToUpdateId);
                      const existingMcpToolCalls = currentMessage?.mcpToolCalls || [];
                      const updatedMcpToolCalls = [...existingMcpToolCalls];
                      
                      const existingIndex = updatedMcpToolCalls.findIndex(tc => tc.tool_call_id === parsedChunk.tool_call_id);
                      if (existingIndex >= 0) {
                        updatedMcpToolCalls[existingIndex] = toolCallStatus;
                      } else {
                        updatedMcpToolCalls.push(toolCallStatus);
                      }
                      
                      freshChatStore.updateMessage(freshActiveChatId, messageToUpdateId, {
                        mcpToolCalls: updatedMcpToolCalls
                      });
                    }
                  } else if (parsedChunk.type === 'tool_call_result') {
                    const messageToUpdateId = messageIdForToolUpdates;
                    if (messageToUpdateId && parsedChunk.tool_call_id) {
                      const currentMessage = freshChatStore.messages[freshActiveChatId]?.find(m => m.id === messageToUpdateId);
                      const existingMcpToolCalls = currentMessage?.mcpToolCalls || [];
                      const updatedMcpToolCalls = existingMcpToolCalls.map(tc =>
                        tc.tool_call_id === parsedChunk.tool_call_id
                          ? {
                              ...tc,
                              status: 'success' as const,
                              result: parsedChunk.result,
                              timestamp: new Date()
                            }
                          : tc
                      );
                      
                      freshChatStore.updateMessage(freshActiveChatId, messageToUpdateId, {
                        mcpToolCalls: updatedMcpToolCalls
                      });
                    }
                  } else if (parsedChunk.type === 'tool_call_error') {
                    const messageToUpdateId = messageIdForToolUpdates;
                    if (messageToUpdateId && parsedChunk.tool_call_id) {
                      const currentMessage = freshChatStore.messages[freshActiveChatId]?.find(m => m.id === messageToUpdateId);
                      const existingMcpToolCalls = currentMessage?.mcpToolCalls || [];
                      const updatedMcpToolCalls = existingMcpToolCalls.map(tc =>
                        tc.tool_call_id === parsedChunk.tool_call_id
                          ? {
                              ...tc,
                              status: 'error' as const,
                              error: typeof parsedChunk.error === 'string' ? parsedChunk.error : parsedChunk.error?.message || '工具调用失败',
                              timestamp: new Date()
                            }
                          : tc
                      );
                      
                      freshChatStore.updateMessage(freshActiveChatId, messageToUpdateId, {
                        mcpToolCalls: updatedMcpToolCalls
                      });
                    }
                  } else if (parsedChunk.type === 'message_end' && currentStreamAssistantMessageId) {
                    const finalMsgStore = freshChatStore.messages[freshActiveChatId];
                    const finalMsg = finalMsgStore?.find(m => m.id === currentStreamAssistantMessageId);
                    
                    freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, {
                      isLoading: false,
                      content: currentStreamAccumulatedContent,
                    });

                    if (!finalMsg?.tool_calls || finalMsg.tool_calls.length === 0) {
                      setChatLoading(false);
                    }
                    currentStreamAssistantMessageId = null;
                    currentStreamAccumulatedContent = "";
                  } else if (parsedChunk.type === 'error' && parsedChunk.error) {
                    const errorMsg = `${parsedChunk.error.message}${parsedChunk.error.details ? ` (详情: ${parsedChunk.error.details})` : ''}`;
                    if (currentStreamAssistantMessageId && freshActiveChatId) {
                      freshChatStore.updateMessage(freshActiveChatId, currentStreamAssistantMessageId, { error: errorMsg, isLoading: false });
                    } else {
                      setChatError(errorMsg);
                    }
                    setChatLoading(false);
                  }
                } catch (e) {
                  console.error("解析流块时出错:", e, "块:", jsonString);
                  setChatError("解析响应数据时出错");
                  setChatLoading(false);
                }
              }
            }
          } catch (error: any) {
            console.error("发送消息或处理流时出错:", error);
            const finalActiveChatIdOnError = get().activeChatId;
            
            if (finalActiveChatIdOnError) {
              const errorAssistantMessage: Partial<Omit<Message, "chatId">> & Pick<Message, "role"> & { content: string | null } = {
                role: 'assistant',
                content: `抱歉，处理您的请求时遇到错误：${error.message || "发送失败"}`,
                error: error.message || "发送失败",
                isLoading: false,
              };
              
              addMessage(finalActiveChatIdOnError, errorAssistantMessage);
            }
            
            setChatLoading(false);
          }
        },
      }),
      {
        name: 'mcpilot-chat-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        // partialize: (state) => ({ // Optionally persist only a subset of the state
        //   chatSessions: state.chatSessions,
        //   activeChatId: state.activeChatId,
        //   messages: state.messages, // Be careful with persisting large message histories
        // }),
        // Custom serialization/deserialization for Date objects
        serialize: (state) => {
          return JSON.stringify({
            ...state,
            state: {
              ...state.state,
              chatSessions: state.state.chatSessions.map(session => ({
                ...session,
                createdAt: session.createdAt.toISOString(),
                updatedAt: session.updatedAt.toISOString(),
              })),
              messages: Object.fromEntries(
                Object.entries(state.state.messages).map(([chatId, msgs]) => [
                  chatId,
                  msgs.map(msg => ({
                    ...msg,
                    createdAt: msg.createdAt.toISOString(),
                    updatedAt: msg.updatedAt ? msg.updatedAt.toISOString() : undefined,
                  })),
                ])
              ),
            }
          });
        },
        deserialize: (str) => {
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              chatSessions: parsed.state.chatSessions.map((session: any) => ({
                ...session,
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt),
              })),
              messages: Object.fromEntries(
                Object.entries(parsed.state.messages as Record<string, any[]>).map(([chatId, msgs]) => [
                  chatId,
                  msgs.map((msg: any) => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt),
                    updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : undefined,
                  })),
                ])
              ),
            }
          };
        },
      }
    )
  )
);