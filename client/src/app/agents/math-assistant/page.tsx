"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Textarea } from '@/components/Common/Textarea';
import { Label } from '@/components/Common/Label';
import { useSettingsStore } from '@/store/settingsStore';
import { ScrollArea } from '@/components/Common/ScrollArea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import { Home } from 'lucide-react';
import Link from 'next/link';
import MessageItem from '@/components/Chat/MessageItem';
import { useAgentChat } from '@/hooks/useAgentChat'; // Import the new hook

const MATH_AGENT_ID = 'math-assistant';
const MATH_SYSTEM_PROMPT = `你是一个专业的数学助手，专注于解决高等数学和线性代数问题。
请遵循以下规则：
1. 分析问题类型（代数、微积分、线性代数等）
2. 根据问题复杂度决定是否使用工具
3. 使用工具时，必须严格按照工具定义的输入格式
4. 提供最终答案和详细解释
请用中文回答，并使用数学符号和公式（LaTeX格式）清晰展示解题过程。
`;
const MATH_TOOLS = [
  { name: 'calculator', keywords: ['calculator', '计算器', 'calcu', 'calc'] },
  { name: 'python', keywords: ['python', 'py', '代码解释器', '代码执行', '解释器'] },
  { name: 'web_search', keywords: ['web_search', 'web search', '网页搜索', '网络搜索', 'search'] }
];

export default function MathAssistantPage() {
  const [userInput, setUserInput] = useState('');
  const { models, getProviderById, appSettings } = useSettingsStore();
  
  const {
    messages,
    sendMessage,
    isLoading,
    toolStatus,
    anyToolOnline,
    session,
    updateChatSessionSettings,
  } = useAgentChat({
    agentId: MATH_AGENT_ID,
    systemPrompt: MATH_SYSTEM_PROMPT,
    requiredTools: MATH_TOOLS,
  });

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Effect to sync the selected model with the chat session
  useEffect(() => {
    if (session && appSettings.defaultModelId && !session.modelId) {
      setSelectedModelId(appSettings.defaultModelId);
      updateChatSessionSettings(session.id, { modelId: appSettings.defaultModelId });
    } else if (session?.modelId) {
      setSelectedModelId(session.modelId);
    }
  }, [session, appSettings.defaultModelId, updateChatSessionSettings]);

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    if (session) {
      updateChatSessionSettings(session.id, { modelId });
    }
  };

  const modelOptions = useMemo(() => {
    return models.map(model => ({
      value: model.id,
      label: `${getProviderById(model.providerId)?.name || 'Unknown'} - ${model.name}`
    }));
  }, [models, getProviderById]);

  const handleSubmit = () => {
    sendMessage(userInput);
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
            <Select onValueChange={handleModelChange} value={selectedModelId || ''}>
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
                disabled={isLoading || !anyToolOnline}
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
                  disabled={isLoading || !userInput.trim() || !anyToolOnline}
                  className="w-full md:w-auto"
                >
                  {isLoading ? '思考中...' : '提交问题'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}