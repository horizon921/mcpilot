import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import type { AIProvider, AIModel, AppSettings, AIProviderType } from '@/types/config';

import type { MCPServerInfo, MCPServerPayload } from '@/types/mcp'; // Import MCP types

// Helper to generate ID if needed, or assume IDs come from a backend/user input
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export type ThemeColor = "default" | "green" | "orange" | "purple";

export interface SettingsStoreState {
  providers: AIProvider[];
  models: AIModel[];
  mcpServers: MCPServerInfo[]; // New state for MCP Servers
  appSettings: Omit<AppSettings, "theme"> & { themeColor?: ThemeColor };
  // For managing API keys securely - this is a placeholder.
  // In a real app, API keys should ideally be handled server-side or via secure storage.
  // For local-first apps, they might be stored here but with strong warnings to the user.
  apiKeys: Record<string, string>; // providerId -> apiKey

  // --- Provider Actions ---
  addProvider: (providerData: Omit<AIProvider, "id">) => AIProvider;
  updateProvider: (providerId: string, updates: Partial<Omit<AIProvider, "id" | "type">>) => void;
  removeProvider: (providerId: string) => void;
  getProviderById: (providerId: string) => AIProvider | undefined;

  // --- Model Actions ---
  addModel: (providerId: string, modelData: Omit<AIModel, "id" | "providerId">) => AIModel;
  updateModel: (modelId: string, updates: Partial<Omit<AIModel, "id" | "providerId">>) => void;
  removeModel: (modelId: string) => void;
  getModelById: (modelId: string) => AIModel | undefined;
  getModelsByProvider: (providerId: string) => AIModel[];
  setDefaultModel: (modelId: string | undefined) => void; // Sets global default

  // --- AppSettings Actions ---
  updateAppSettings: (settings: Partial<Omit<AppSettings, "theme"> & { themeColor?: ThemeColor }>) => void;
  setThemeColor: (color: ThemeColor) => void;
  toggleInputPreprocessing: (enabled: boolean) => void;

  // --- API Key Actions (handle with care) ---
  setApiKey: (providerId: string, apiKey: string) => void;
  getApiKey: (providerId: string) => string | undefined;
  removeApiKey: (providerId: string) => void;

  // --- MCP Server Actions ---
  addMCPServer: (serverData: MCPServerPayload) => MCPServerInfo;
  updateMCPServer: (serverId: string, updates: Partial<MCPServerPayload>) => void;
  removeMCPServer: (serverId: string) => void;
  toggleMCPServerEnabled: (serverId: string, isEnabled: boolean) => void; // For enabling/disabling in chat
  getMCPServerById: (serverId: string) => MCPServerInfo | undefined;
  getEnabledMCPServers: () => MCPServerInfo[];
  updateMCPServerDetails: (serverId: string, details: { status: MCPServerInfo['status']; errorDetails?: string; tools?: MCPServerInfo['tools'] }) => void; // New action
}

export const useSettingsStore = create<SettingsStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        providers: [],
        models: [],
        mcpServers: [], // Initialize MCP Servers as empty
        appSettings: {
          themeColor: "default", // 只保留主题色
          defaultModelId: "gpt-4-default",
          enableInputPreprocessing: true, // Default to true
        },
        apiKeys: {},

        // --- Provider Implementations ---
        addProvider: (providerData) => {
          const newProvider: AIProvider = { id: generateId(), ...providerData };
          set((state) => ({ providers: [...state.providers, newProvider] }));
          return newProvider;
        },
        updateProvider: (providerId, updates) => {
          set((state) => ({
            providers: state.providers.map(p =>
              p.id === providerId ? { ...p, ...updates } : p
            ),
          }));
        },
        removeProvider: (providerId) => {
          set((state) => ({
            providers: state.providers.filter(p => p.id !== providerId),
            models: state.models.filter(m => m.providerId !== providerId), // Also remove associated models
            apiKeys: { ...state.apiKeys, [providerId]: undefined! }, // Remove API key
          }));
          // If the removed provider had the default model, clear it
          const defaultModel = get().appSettings.defaultModelId;
          if (defaultModel && get().getModelById(defaultModel)?.providerId === providerId) {
            get().setDefaultModel(undefined);
          }
        },
        getProviderById: (providerId) => get().providers.find(p => p.id === providerId),

        // --- Model Implementations ---
        addModel: (providerId, modelData) => {
          const newModel: AIModel = { ...modelData, id: generateId(), providerId };
          set((state) => ({ models: [...state.models, newModel] }));
          return newModel;
        },
        updateModel: (modelId, updates) => {
          set((state) => ({
            models: state.models.map(m =>
              m.id === modelId ? { ...m, ...updates } : m
            ),
          }));
        },
        removeModel: (modelId) => {
          set((state) => ({
            models: state.models.filter(m => m.id !== modelId),
          }));
           // If this was the default model, clear it
          if (get().appSettings.defaultModelId === modelId) {
            get().setDefaultModel(undefined);
          }
        },
        getModelById: (modelId) => get().models.find(m => m.id === modelId),
        getModelsByProvider: (providerId) => get().models.filter(m => m.providerId === providerId),
        setDefaultModel: (modelId) => {
          set(state => ({
            appSettings: { ...state.appSettings, defaultModelId: modelId },
            models: state.models.map(m => ({
              ...m,
              isDefault: m.id === modelId
            }))
          }));
        },

        // --- AppSettings Implementations ---
        updateAppSettings: (settings) => {
          set((state) => ({
            appSettings: { ...state.appSettings, ...settings },
          }));
        },
        setThemeColor: (color) => {
          set((state) => ({
            appSettings: { ...state.appSettings, themeColor: color }
          }));
        },
        toggleInputPreprocessing: (enabled) => {
          set((state) => ({
            appSettings: { ...state.appSettings, enableInputPreprocessing: enabled },
          }));
        },

        // --- API Key Implementations ---
        setApiKey: (providerId, apiKey) => {
          set((state) => ({
            apiKeys: { ...state.apiKeys, [providerId]: apiKey },
          }));
        },
        getApiKey: (providerId) => get().apiKeys[providerId],
        removeApiKey: (providerId) => {
          set((state) => {
            const newApiKeys = { ...state.apiKeys };
            delete newApiKeys[providerId];
            return { apiKeys: newApiKeys };
          });
        },

        // --- MCP Server Implementations ---
        addMCPServer: (serverData) => {
          const newServer: MCPServerInfo = {
            ...serverData,
            id: generateId(),
            status: 'disconnected', // Initial status
            isEnabled: true, // Default to enabled
          };
          set(state => ({ mcpServers: [...state.mcpServers, newServer] }));
          return newServer;
        },
        updateMCPServer: (serverId, updates) => {
          set(state => ({
            mcpServers: state.mcpServers.map(s =>
              s.id === serverId ? { ...s, ...updates, status: 'disconnected' } : s // Reset status on update for re-check
            ),
          }));
        },
        removeMCPServer: (serverId) => {
          set(state => ({
            mcpServers: state.mcpServers.filter(s => s.id !== serverId),
          }));
        },
        toggleMCPServerEnabled: (serverId, isEnabled) => {
          set(state => ({
            mcpServers: state.mcpServers.map(s =>
              s.id === serverId ? { ...s, isEnabled } : s
            ),
          }));
        },
        getMCPServerById: (serverId) => get().mcpServers.find(s => s.id === serverId),
        getEnabledMCPServers: () => get().mcpServers.filter(s => s.isEnabled),
        updateMCPServerDetails: (serverId, details) => {
          set(state => ({
            mcpServers: state.mcpServers.map(s =>
              s.id === serverId ? {
                ...s,
                status: details.status,
                errorDetails: details.errorDetails,
                tools: details.tools,
                updatedAt: new Date(), // Also update timestamp
              } : s
            ),
          }));
        },
      }),
      {
        name: 'mcpilot-settings-storage',
        storage: createJSONStorage(() => localStorage),
        // partialize: (state) => ({ // Persist only non-sensitive parts if needed
        //   providers: state.providers,
        //   models: state.models,
        //   appSettings: state.appSettings,
        //   // DO NOT persist apiKeys directly if they are sensitive and not handled by a secure backend
        // }),
      }
    )
  )
);