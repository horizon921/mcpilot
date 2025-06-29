"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Textarea } from '@/components/Common/Textarea';
import { Label } from '@/components/Common/Label';
import { useSettingsStore } from '@/store/settingsStore';
import { ScrollArea } from '@/components/Common/ScrollArea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import type { Message, MCPToolCallStatus } from '@/types/chat';
import { Home, List, Bookmark, Search } from 'lucide-react';
import Link from 'next/link';
import MessageItem from '@/components/Chat/MessageItem'; // Import MessageItem

export default function TreeholeAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [action, setAction] = useState<'summary' | 'bookmarks' | 'query'>('summary');
  const { mcpServers } = useSettingsStore(state => ({ mcpServers: state.mcpServers }));

  const isCrawlerOnline = useMemo(() => mcpServers.some(server =>
    server.status === 'connected' &&
    (
      (server.name.toLowerCase().includes('treehole') ||
       server.name.toLowerCase().includes('树洞') ||
       (server.description && (
          server.description.toLowerCase().includes('treehole') ||
          server.description.toLowerCase().includes('树洞')
       ))) ||
      (server.tools && server.tools.some(tool =>
        tool.name.toLowerCase().includes('treehole') ||
        tool.name.toLowerCase().includes('树洞')
      ))
    )
  ), [mcpServers]);

  const { models, providers, getModelById, getProviderById, getApiKey, appSettings } = useSettingsStore();

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
      server.isEnabled && server.status === 'connected' && server.tools && server.tools.length > 0 &&
      (server.name.toLowerCase().includes('treehole') || server.name.toLowerCase().includes('树洞'))
    );

    const requestBody = {
      chatId: `agent-treehole-${Date.now()}`,
      messages: messageHistory,
      modelNativeId: model.modelNativeId,
      providerId: provider.id,
      providerType: provider.type,
      baseUrl: provider.baseUrl,
      systemPrompt: systemPrompt,
      stream: true,
      clientProvidedApiKey: getApiKey(provider.id) || undefined,
      enabledMcpServers: enabledMcpServers,
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

  const handleAction = (actionType: 'summary' | 'bookmarks' | 'query') => {
    if (!isCrawlerOnline) {
      toast.error("树洞爬虫服务未在线，无法使用此功能");
      return;
    }
    setAction(actionType);
    setMessages([]); // Clear previous messages

    let systemPrompt = '';
    let userPrompt = '';

    switch (actionType) {
      case 'summary':
        systemPrompt = `你是一个北大树洞信息助手，负责总结最近一天树洞上的高价值信息。
请按照以下格式总结：
1. 重要通知类（选课、考试、活动等）
2. 热点讨论话题（按热度排序）
3. 情感生活类（温馨、求助等）
4. 学术科研类（论文、竞赛等）
5. 其他有价值信息
每类列出3-5条，每条用一句话概括，并注明原帖的大致时间（例如“昨天下午”、“昨晚”等）。`;
        userPrompt = "请总结最近一天树洞的高价值信息。";
        break;
      case 'bookmarks':
        systemPrompt = `你是一个北大树洞信息助手，负责总结用户收藏的树洞帖子。
用户已经收藏了一些帖子，请按照时间倒序列出这些帖子，并为每个帖子提供一句话总结。
注意：如果帖子有更新（如回复），请特别标注“有更新”并总结最新内容。`;
        userPrompt = "请总结我收藏的树洞帖子。";
        break;
      case 'query':
        if (!userInput.trim()) {
          toast.error("请输入问题");
          return;
        }
        systemPrompt = `你是一个北大树洞信息助手，负责回答用户关于树洞信息的提问。
你可以使用树洞爬虫工具搜索相关信息，然后根据搜索结果回答用户问题。
回答要求：
1. 直接回答问题，不要提及使用了工具
2. 引用树洞信息时注明发帖时间和大致内容
3. 如果问题涉及多个帖子，请进行整合回答`;
        userPrompt = userInput;
        break;
    }

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      chatId: '',
      role: 'user',
      content: userPrompt,
      createdAt: new Date(),
    };

    setMessages([newUserMessage]);
    callChatAPI(systemPrompt, [newUserMessage]);
    if (actionType === 'query') setUserInput('');
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
          <h1 className="text-2xl font-bold">树洞信息助手</h1>
        </div>

        <div className="space-y-4 flex-grow">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium mb-2">树洞爬虫状态</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isCrawlerOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">树洞爬虫服务</span>
              <span className="text-xs ml-2 text-gray-500">
                {isCrawlerOnline ? '在线' : '离线'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant={action === 'summary' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => handleAction('summary')}
              disabled={loading}
            >
              <List size={16} className="mr-2" />
              总结最近树洞
            </Button>
            <Button 
              variant={action === 'bookmarks' ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => handleAction('bookmarks')}
              disabled={loading}
            >
              <Bookmark size={16} className="mr-2" />
              收藏帖子总结
            </Button>
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
                    {messages.length === 0 && <div className="text-center text-gray-500">请选择操作或输入问题...</div>}
                    {messages.map((msg) => (
                        <MessageItem key={msg.id} message={msg} />
                    ))}
                </div>
            </ScrollArea>
            
            {action === 'query' && (
              <div className="flex-shrink-0">
                <Label>关于树洞的问题</Label>
                <Textarea 
                  value={userInput} 
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入关于树洞的问题，例如：最近有人讨论端午节活动吗？"
                  rows={3}
                  disabled={loading || !isCrawlerOnline}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAction('query');
                    }
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button 
                    onClick={() => handleAction('query')} 
                    disabled={loading || !userInput.trim() || !isCrawlerOnline}
                    className="w-full md:w-auto"
                  >
                    {loading ? '查询中...' : '查询'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}