import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import type { Message, ChatSession, UserProfile, ToolCall, MessageRole } from '@/types/chat';
import type { AIModel } from '@/types/config'; // Assuming we might store model info per chat

// --- Helper Functions (Consider moving to a utils file if they grow) ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

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
            isLoading: role === "user", // User message itself isn't loading, but implies AI will load
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
        }
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