"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/Common/Button';
import { Input } from '@/components/Common/Input';
import { Textarea } from '@/components/Common/Textarea';
import { Label } from '@/components/Common/Label';
import { useSettingsStore } from '@/store/settingsStore';
import { ScrollArea } from '@/components/Common/ScrollArea';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Common/Select';
import type { Message } from '@/types/chat';
import { ArrowLeft, Check, Home, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function MathAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<Partial<Message>[]>([]);
  const { mcpServers } = useSettingsStore(state => ({ mcpServers: state.mcpServers }));

  const { models, providers, getModelById, getProviderById, getApiKey, appSettings } = useSettingsStore();

  // 检查所需的MCP服务是否在线
  // 定义工具关键词列表（中英文）
  const mathTools = [
    {
      name: 'calculator',
      keywords: ['calculator', '计算器', 'calcu', 'calc']
    },
    {
      name: 'python',
      keywords: ['python', 'py', '代码解释器', '代码执行', '解释器']
    },
    {
      name: 'web_search',
      keywords: ['web_search', 'web search', '网页搜索', '网络搜索', 'search']
    }
  ];

  // 检查每个工具是否可用
  // 检查每个工具是否可用
  const toolStatus = mathTools.map(tool => {
    const isAvailable = mcpServers.some(server => {
      if (server.status !== 'connected') return false;
      
      // 检查服务名称或描述
      const nameOrDescMatch = tool.keywords.some(kw => {
        return (
          server.name.toLowerCase().includes(kw) ||
          (server.description && server.description.toLowerCase().includes(kw))
        );
      });
      
      // 检查工具名称
      const toolNameMatch = server.tools?.some(t => {
        return tool.keywords.some(kw =>
          t.name.toLowerCase().includes(kw)
        );
      });
      
      return nameOrDescMatch || toolNameMatch;
    });
    
    return {
      name: tool.name,
      online: isAvailable
    };
  });

  // 只要有一个工具在线即可使用
  const anyToolOnline = toolStatus.some(t => t.online);
  const serverStatus = toolStatus;

  // 初始化模型选择
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

  const callChatAPIStream = async (
    systemPrompt: string,
    messages: Partial<Message>[],
    onStart: () => void,
    onDelta: (chunk: string) => void,
    onEnd: () => void
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

    onStart();
    setLoading(true);

    try {
      
      // 简化工具检测逻辑
      const enabledMcpServers = mcpServers.filter(server =>
        server.status === 'connected' &&
        mathTools.some(mathTool => {
          const hasKeywordMatch = mathTool.keywords.some(kw =>
            server.name.toLowerCase().includes(kw) ||
            (server.description && server.description.toLowerCase().includes(kw))
          );
          const hasToolMatch = server.tools?.some(tool =>
            mathTool.keywords.some(kwTool => tool.name.toLowerCase().includes(kwTool))
          );
          return hasKeywordMatch || hasToolMatch;
        })
      );
  
      const requestBody: any = {
        messages,
        modelNativeId: model.modelNativeId,
        providerId: provider.id,
        providerType: provider.type,
        baseUrl: provider.baseUrl,
        systemPrompt: systemPrompt,
        stream: true,
        clientProvidedApiKey: getApiKey(provider.id) || undefined,
        enabledMcpServers: enabledMcpServers.map(server => ({
          id: server.id,
          name: server.name,
          baseUrl: server.baseUrl,
          parameters: server.parameters,
          tools: server.tools
        })),
      };
  
      if (model.maxTokens) {
        requestBody.maxTokens = model.maxTokens;
      }
  
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
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const jsonString = line.substring('data: '.length);
          try {
            const parsed = JSON.parse(jsonString);
            if (parsed.type === 'content_delta' && parsed.content) {
              onDelta(parsed.content);
              fullResponse += parsed.content;
            }
            // 处理工具调用事件
            else if (parsed.type === 'tool_calls' && parsed.tool_calls) {
              // 更新历史记录
              setHistory(prev => [
                ...prev,
                { role: 'assistant', content: '', tool_calls: parsed.tool_calls }
              ]);
            }
            else if (parsed.type === 'tool_call_result') {
              // 添加工具调用结果到历史记录
              setHistory(prev => [
                ...prev,
                { role: 'tool', content: JSON.stringify(parsed.result), tool_call_id: parsed.tool_call_id }
              ]);
            }
          } catch (e) {
            console.error("解析流块时出错:", e, "块:", jsonString);
          }
        }
      }

      // 更新历史记录 - 使用userInput替代userPrompt
      setHistory(prev => [
        ...prev,
        { role: 'user', content: userInput },
        { role: 'assistant', content: fullResponse }
      ]);
    } catch (error: any) {
      toast.error(`请求失败: ${error.message}`);
    } finally {
      setLoading(false);
      onEnd();
    }
  };

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    if (!anyToolOnline) {
      toast.error("没有可用的MCP服务，无法使用此功能");
      return;
    }

    // 动态生成可用工具描述
    const availableTools = toolStatus
      .filter(tool => tool.online)
      .map(tool => {
        switch (tool.name) {
          case 'calculator':
            return '1. 计算器：用于数值计算';
          case 'python':
            return '2. Python解释器：用于执行数学计算和符号运算';
          case 'web_search':
            return '3. 网络搜索：用于查找数学概念和公式';
          default:
            return '';
        }
      })
      .filter(desc => desc !== '')
      .join('\n');

    // 生成工具描述
    const toolDescriptions = mathTools
      .filter(mathTool => {
        const status = toolStatus.find(t => t.name === mathTool.name);
        return status?.online;
      })
      .map(mathTool => {
        const server = mcpServers.find(s =>
          s.status === 'connected' &&
          s.tools?.some(t => t.name && mathTool.keywords.some(kw => t.name.toLowerCase().includes(kw)))
        );
        
        if (!server) return '';
        
        const toolInfo = server.tools?.find(t =>
          t.name && mathTool.keywords.some(kw => t.name.toLowerCase().includes(kw))
        );
        
        return toolInfo
          ? `- ${toolInfo.name}: ${toolInfo.description}\n  输入参数: ${JSON.stringify(toolInfo.input_schema)}`
          : '';
      })
      .filter(desc => desc !== '')
      .join('\n');

    const systemPrompt = `你是一个专业的数学助手，专注于解决高等数学和线性代数问题。
${toolDescriptions ? `你可以使用以下工具：\n${toolDescriptions}\n` : ''}
请遵循以下规则：
1. 分析问题类型（代数、微积分、线性代数等）
2. 根据问题复杂度决定是否使用工具
3. 使用工具时，必须严格按照工具定义的输入格式
4. 提供最终答案和详细解释

请用中文回答，并使用数学符号和公式（LaTeX格式）清晰展示解题过程。
`;
    
    // 构建完整的聊天消息历史
    const messages: Partial<Message>[] = [
      ...history,
      { role: 'user', content: userInput }
    ];
    
    // 调用增强的API（支持工具调用）
    callChatAPIStream(
      systemPrompt,
      messages,
      () => { setResponse(''); },
      (delta) => setResponse(prev => prev + delta),
      () => { setUserInput(''); }
    );
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
            <div className="flex-grow mb-4">
              <ScrollArea className="h-full border rounded-lg p-4 bg-white dark:bg-gray-900">
                <ReactMarkdown className="prose dark:prose-invert max-w-none">
                  {response || "请提出您的数学问题，我将尽力解答..."}
                </ReactMarkdown>
              </ScrollArea>
            </div>
            
            <div className="flex-shrink-0">
              <Label>数学问题</Label>
              <Textarea 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入数学问题，例如：计算∫(0到π) sin(x) dx"
                rows={3}
                disabled={loading || !anyToolOnline}
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