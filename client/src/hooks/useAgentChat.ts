"use client";

import { useEffect, useMemo, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { Message, ChatSession } from '@/types/chat';
import { toast } from 'sonner';



interface AgentTool {
  name: string;
  keywords: string[];
}

interface UseAgentChatOptions {
  agentId: string;
  systemPrompt: string;
  requiredTools: AgentTool[];
}

export function useAgentChat({ agentId, systemPrompt, requiredTools }: UseAgentChatOptions) {
  const agentSessionId = `agent-${agentId}`;

  const {
    createChatSession,
    loadChatSession,
    getActiveChatSession,
    updateChatSessionSettings,
    getActiveChatMessages,
    isLoading: isChatLoading,
    handleSendMessage,
  } = useChatStore();

  const { mcpServers, getModelById, getProviderById, getApiKey, appSettings } = useSettingsStore();
  
  const [session, setSession] = useState<ChatSession | undefined>(undefined);

  // Memoize tool status based on the reliable store state
  const toolStatus = useMemo(() => requiredTools.map(tool => {
    const isAvailable = mcpServers.some(server => {
      if (server.status !== 'connected') return false;
      const nameOrDescMatch = tool.keywords.some(kw =>
        server.name.toLowerCase().includes(kw) ||
        (server.description && server.description.toLowerCase().includes(kw))
      );
      const toolNameMatch = server.tools?.some(t =>
        tool.keywords.some(kw => t.name.toLowerCase().includes(kw))
      );
      return nameOrDescMatch || toolNameMatch;
    });
    return { name: tool.name, online: isAvailable };
  }), [mcpServers, requiredTools]);

  const anyToolOnline = useMemo(() => toolStatus.some(t => t.online), [toolStatus]);

  // Effect to initialize and configure the agent's chat session
  useEffect(() => {
    const chatStore = useChatStore.getState();
    let sessionToUse = chatStore.chatSessions.find(s => s.id === agentSessionId);

    if (!sessionToUse) {
      console.log(`Creating new chat session for agent: ${agentId}`);
      sessionToUse = createChatSession(
        "user-agent", // A generic user ID for agents
        `Agent: ${agentId}`,
        appSettings.defaultModelId
      );
      // We need to rename the session ID to our stable agent ID
      const sessions = chatStore.chatSessions.filter(s => s.id !== sessionToUse!.id);
      const messages = chatStore.messages;
      const sessionMessages = messages[sessionToUse.id];
      delete messages[sessionToUse.id];
      
      sessionToUse.id = agentSessionId;
      
      useChatStore.setState({
        chatSessions: [...sessions, sessionToUse],
        messages: { ...messages, [agentSessionId]: sessionMessages || [] }
      });
    }
    
    setSession(sessionToUse);
    loadChatSession(agentSessionId);

    // Configure the session with agent-specific settings
    const enabledMcpServerIds = mcpServers
      .filter(server => server.isEnabled && server.status === 'connected')
      .map(server => server.id);

    updateChatSessionSettings(agentSessionId, {
      systemPrompt: systemPrompt,
      enabledMcpServers: enabledMcpServerIds,
    });

  }, [agentId, systemPrompt, mcpServers, appSettings.defaultModelId]);

  const messages = useMemo(() => {
    if (useChatStore.getState().activeChatId !== agentSessionId) return [];
    return getActiveChatMessages();
  }, [getActiveChatMessages, useChatStore.getState().messages[agentSessionId], useChatStore.getState().activeChatId]);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;
    if (!anyToolOnline) {
      toast.error("A required MCP service is offline. Cannot proceed.");
      return;
    }
    if (!session) {
      toast.error("Chat session not initialized.");
      return;
    }
    
    // Call the central handleSendMessage action from the chat store
    await handleSendMessage(userInput);
  };

  return {
    messages,
    sendMessage,
    isLoading: isChatLoading,
    toolStatus,
    anyToolOnline,
    session,
    updateChatSessionSettings,
  };
}