"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Textarea } from '@/components/Common/Textarea';
import { Label } from '@/components/Common/Label';
import { useSettingsStore } from '@/store/settingsStore';
import { ScrollArea } from '@/components/Common/ScrollArea';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import type { Message, ToolCall, MCPToolCallStatus } from '@/types/chat';
import { Home, Calculator, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import MessageItem from '@/components/Chat/MessageItem'; // Import MessageItem

export default function MathAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { mcpServers } = useSettingsStore(state => ({ mcpServers: state.mcpServers }));

  const { models, providers, getModelById, getProviderById, getApiKey, appSettings } = useSettingsStore();

  const mathTools = [
    { name: 'calculator', keywords: ['calculator', '计算器', 'calcu', 'calc'] },
    { name: 'python', keywords: ['python', 'py', '代码解释器', '代码执行', '解释器'] },
    { name: 'web_search', keywords: ['web_search', 'web search', '网页搜索', '网络搜索', 'search'] }
  ];

  const toolStatus = useMemo(() => mathTools.map(tool => {
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
  }), [mcpServers]);

  const anyToolOnline = useMemo(() => toolStatus.some(t => t.online), [toolStatus]);

  useEffect(() => {
    if (!selectedModelId && appSettings.defaultModelId) {
      setSelectedModelId(appSettings.defaultModelId);
    }
  }, [selectedModelId, appSettings.defaultModelId]);

  const modelOptions = useMemo(() => {
    return models.map(model => ({
      value: model.id,
      label: `${getProviderById(model.providerId)?.name || 'Unknown'} - ${model.name}`
    }));
  }, [models, getProviderById]);

  const callChatAPI = async (
    systemPrompt: string,
    messageHistory: Partial<Message>[],
  ) => {
    if (!selectedModelId) {
      toast.error("请先选择一个模型");
      return;
    }
    const model = getModelById(selectedModelId);
    if (!model) {
      toast.error(`未找到ID为 ${selectedModelId} 的模型配置`);
      return;
    }
    const provider = getProviderById(model.providerId);
    if (!provider) {
      toast.error("找不到模型对应的提供商");
      return;
    }

    setLoading(true);

    const enabledMcpServers = mcpServers.filter(server =>
      server.isEnabled && server.status === 'connected' && server.tools && server.tools.length > 0
    );

    const requestBody = {
      chatId: `agent-math-${Date.now()}`,
      messages: messageHistory,
      modelNativeId: model.modelNativeId,
      providerId: provider.id,
      providerType: provider.type,
      baseUrl: provider.baseUrl,
      systemPrompt: systemPrompt,
      stream: true,
      clientProvidedApiKey: getApiKey(provider.id) || undefined,
      enabledMcpServers: enabledMcpServers, // Pass the full server objects
    };

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API 错误: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAssistantMessageId: string | null = null;
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.substring('data: '.length));

            if (parsed.type === 'message_start') {
              currentAssistantMessageId = parsed.message.id;
              setMessages(prev => [...prev, {
                id: parsed.message.id,
                chatId: parsed.message.chatId,
                role: 'assistant',
                content: '',
                createdAt: new Date(parsed.message.createdAt),
                isLoading: true,
              }]);
            } else if (parsed.type === 'content_delta' && currentAssistantMessageId) {
              accumulatedContent += parsed.content;
              setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, content: accumulatedContent, isLoading: false } : m));
            } else if (parsed.type === 'tool_calls' && currentAssistantMessageId) {
              setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, tool_calls: parsed.tool_calls, isLoading: false } : m));
            } else if (parsed.type === 'tool_call_start' && currentAssistantMessageId) {
                const newStatus: MCPToolCallStatus = {
                    tool_call_id: parsed.tool_call_id,
                    tool_name: parsed.tool_name,
                    server_name: parsed.server_name,
                    status: 'calling',
                    timestamp: new Date(),
                };
                setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, mcpToolCalls: [...(m.mcpToolCalls || []).filter(tc => tc.tool_call_id !== parsed.tool_call_id), newStatus] } : m));
            } else if (parsed.type === 'tool_call_result' && currentAssistantMessageId) {
                setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, mcpToolCalls: (m.mcpToolCalls || []).map(tc => tc.tool_call_id === parsed.tool_call_id ? { ...tc, status: 'success', result: parsed.result, timestamp: new Date() } : tc) } : m));
            } else if (parsed.type === 'tool_call_error' && currentAssistantMessageId) {
                setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, mcpToolCalls: (m.mcpToolCalls || []).map(tc => tc.tool_call_id === parsed.tool_call_id ? { ...tc, status: 'error', error: parsed.error, timestamp: new Date() } : tc) } : m));
            } else if (parsed.type === 'message_end' && currentAssistantMessageId) {
              setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, isLoading: false } : m));
            } else if (parsed.type === 'error') {
              toast.error(`Stream error: ${parsed.error.message}`);
              setMessages(prev => prev.map(m => m.id === currentAssistantMessageId ? { ...m, error: parsed.error.message, isLoading: false } : m));
            }
          } catch (e) {
            console.error("解析流块时出错:", e, "块:", line);
          }
        }
      }
    } catch (error: any) {
      toast.error(`请求失败: ${error.message}`);
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, chatId: '', role: 'assistant', content: `Error: ${error.message}`, createdAt: new Date(), error: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    if (!anyToolOnline) {
      toast.error("没有可用的MCP服务，无法使用此功能");
      return;
    }

    const systemPrompt = `你是一个专业的数学助手，专注于解决高等数学和线性代数问题。
请遵循以下规则：
1. 分析问题类型（代数、微积分、线性代数等）
2. 根据问题复杂度决定是否使用工具
3. 使用工具时，必须严格按照工具定义的输入格式
4. 提供最终答案和详细解释
请用中文回答，并使用数学符号和公式（LaTeX格式）清晰展示解题过程。
`;
    
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      chatId: '',
      role: 'user',
      content: userInput,
      createdAt: new Date(),
    };

    const newMessages: Message[] = [...messages, newUserMessage];
    setMessages(newMessages);
    
    callChatAPI(systemPrompt, newMessages);
    setUserInput('');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <aside className="w-64 flex-shrink-0 p-4 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col">
        <div className="p-2 mb-6">
          <Link href="/" className="inline-block mb-4">
            <Button variant="ghost" className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Home className="w-5 h-5 mr-3" />
              返回主页
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">数学学习辅助</h1>
        </div>

        <div className="space-y-4 flex-grow">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium mb-2">MCP服务状态</h3>
            <div className="space-y-2">
              {toolStatus.map((tool, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${tool.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm capitalize">{tool.name}</span>
                  <span className="text-xs ml-2 text-gray-500">
                    {tool.online ? '在线' : '离线'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-md mx-auto">
            <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">选择模型</Label>
            <Select onValueChange={setSelectedModelId} value={selectedModelId || ''}>
              <SelectTrigger><SelectValue placeholder="选择一个AI模型..." /></SelectTrigger>
              <SelectContent>
                {modelOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-grow mb-4">
              <div className="p-4 space-y-4">
                {messages.length === 0 && <div className="text-center text-gray-500">请提出您的数学问题...</div>}
                {messages.map((msg) => (
                  <MessageItem key={msg.id} message={msg} />
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex-shrink-0">
              <Label>数学问题</Label>
              <Textarea 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入数学问题，例如：计算∫(0到π) sin(x) dx"
                rows={3}
                disabled={loading || !anyToolOnline}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="mt-2 flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !userInput.trim() || !anyToolOnline}
                  className="w-full md:w-auto"
                >
                  {loading ? '思考中...' : '提交问题'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}