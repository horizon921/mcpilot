import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, Part } from '@google/generative-ai'; // Import Gemini SDK
import Ajv, { ValidationError } from "ajv";
import addFormats from "ajv-formats";
import type { Message as ChatMessage, MessageRole, ContentPart } from '@/types/chat';
import type { ChatStreamChunk, StreamError } from '@/types/api';
import type { AIProviderType } from '@/types/config'; // Import AIProviderType
import type { MCPServerInfo, MCPToolDefinition, MCPCallApiRequest, MCPCallApiResponse } from '@/types/mcp';

// Note: API keys are read from process.env.
// For OpenAI: API_KEY_<NORMALIZED_PROVIDER_ID> or OPENAI_API_KEY
// For Anthropic: API_KEY_<NORMALIZED_PROVIDER_ID> or ANTHROPIC_API_KEY
// For Gemini: API_KEY_<NORMALIZED_PROVIDER_ID> or GEMINI_API_KEY
interface ChatApiRequest {
  chatId: string;
  messages: ChatMessage[];
  modelNativeId?: string; // Renamed from modelId, this is the ID the provider uses
  providerId?: string;    // Our app's unique ID for the provider entry (used for API key lookup)
  providerType?: AIProviderType; // Type of the provider (e.g., "openai", "anthropic")
  clientProvidedApiKey?: string; // Optional API key provided by the client from its local storage
  baseUrl?: string;       // For OpenAI compatible or overriding default provider base URLs
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stop?: string[]; // Added for stop sequences
  stream?: boolean; // Added for streaming control
  jsonSchema?: Record<string, any>;
  enableInputPreprocessing?: boolean;
  // MCP integration
  enabledMcpServers?: MCPServerInfo[]; // Complete MCP server info for enabled servers
}

const mapRoleToOpenAI = (role: MessageRole): OpenAI.Chat.ChatCompletionMessageParam['role'] => {
  if (role === 'assistant') return 'assistant';
  if (role === 'tool') return 'tool';
  if (role === 'system') return 'system';
  return 'user';
};

const mapRoleToAnthropic = (role: MessageRole): Anthropic.Messages.MessageParam['role'] => {
  if (role === 'assistant') return 'assistant';
  return 'user';
};

// Helper to map our message roles to Gemini's roles ('user' or 'model')
const mapRoleToGemini = (role: MessageRole): 'user' | 'model' => {
  if (role === 'assistant' || role === 'tool') return 'model'; // Gemini uses 'model' for AI responses, including tool results
  // System prompts are handled differently or prepended to user messages for Gemini
  return 'user';
};

// --- Input Preprocessing ---
function preprocessInput(content: string): string {
  // 1. Sensitive Word Filtering
  const sensitiveWords = [
    // 政治类
    "法轮功", "天安门事件", "六四", "达赖喇嘛", "新疆集中营",
    // 暴力类
    "自杀", "爆炸", "暗杀", "恐怖袭击", "枪支",
    // 色情类
    "色情", "裸体", "成人内容", "AV", "嫖娼",
  ];
  let processedContent = content;
  for (const word of sensitiveWords) {
    const regex = new RegExp(word, "gi");
    processedContent = processedContent.replace(regex, "*".repeat(word.length));
  }

  // 2. Advanced Command Injection Protection
  // 检测真正的恶意指令注入模式，避免误封正常技术讨论
  if (detectMaliciousCommandInjection(processedContent)) {
    console.warn(`Malicious command injection detected and blocked: ${processedContent.substring(0, 100)}...`);
    return " [检测到恶意指令注入，已被拦截] ";
  }

  return processedContent;
}

function detectMaliciousCommandInjection(content: string): boolean {
  // 转换为小写以便检测
  const lowerContent = content.toLowerCase();

  // 1. 检测讨论上下文的关键词，如果存在则很可能是正常讨论
  const discussionKeywords = [
    '如何', '怎么', '什么是', '请问', '能否', '可以', '解释', '说明',
    '举例', '示例', '例子', '学习', '教程', '文档', '原理', '区别',
    'how', 'what', 'why', 'explain', 'example', 'tutorial', 'learn'
  ];

  const hasDiscussionContext = discussionKeywords.some(keyword =>
    lowerContent.includes(keyword)
  );

  // 如果是讨论上下文，降低检测敏感性
  if (hasDiscussionContext) {
    // 只检测最明显的恶意模式
    return detectHighRiskPatterns(content);
  }

  // 2. 检测中等风险的指令注入模式
  return detectHighRiskPatterns(content) || detectMediumRiskPatterns(content);
}

function detectHighRiskPatterns(content: string): boolean {
  // 高风险模式：明显的恶意指令注入
  const highRiskPatterns = [
    // 命令链接和重定向组合
    /;\s*(rm|del|format|fdisk|mkfs|dd)\s+/i,
    /&&\s*(rm|del|format|fdisk|mkfs|dd)\s+/i,
    /\|\|\s*(rm|del|format|fdisk|mkfs|dd)\s+/i,

    // 危险的系统操作
    /\b(rm\s+-rf|del\s+\/[sq]|format\s+c:|fdisk\s+\/mbr)\b/i,

    // 代码执行模式
    /`[^`]*\b(rm|del|wget|curl|nc|netcat)\b[^`]*`/i,
    /\$\([^)]*\b(rm|del|wget|curl|nc|netcat)\b[^)]*\)/i,

    // 网络相关的恶意操作
    /(wget|curl)\s+[^\s]+\s*\|\s*(sh|bash|python|perl)/i,

    // 后门和反向shell
    /\b(nc|netcat|ncat)\s+.*-[el]/i,
    /\/bin\/(sh|bash)\s+-i/i,

    // 权限提升
    /sudo\s+(rm|chmod|chown)\s+.*\/\*/i,

    // 进程操作
    /kill(all)?\s+-9/i,
  ];

  return highRiskPatterns.some(pattern => pattern.test(content));
}

function detectMediumRiskPatterns(content: string): boolean {
  // 中等风险模式：可能的指令注入，但需要更多上下文判断
  const mediumRiskPatterns = [
    // 多个命令操作符连续出现
    /[;&|`]{2,}/,

    // 命令替换在不寻常的上下文中
    /\$\([^)]{20,}\)/,
    /`[^`]{20,}`/,

    // 文件操作与特殊字符组合
    /\b(cat|head|tail|less|more)\s+[^\s]*[;&|]/i,

    // 网络命令与管道
    /(wget|curl|lynx)\s+[^\s]+\s*\|/i,

    // 编码或混淆的命令
    /(echo|printf)\s+[A-Za-z0-9+/=]{20,}\s*\|\s*(base64|xxd)/i,
  ];

  return mediumRiskPatterns.some(pattern => pattern.test(content));
}


function extractJsonFromMarkdown(text: string): string | null {
  // 1. Look for a JSON block within ```json ... ```
  const jsonMarkdownRegex = /```json\n([\s\S]*?)\n```/;
  const match = text.match(jsonMarkdownRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. If not found, look for the first occurrence of `{` and the last occurrence of `}`
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const potentialJson = text.substring(firstBrace, lastBrace + 1);
    try {
      // Try to parse to see if it's valid JSON
      JSON.parse(potentialJson);
      return potentialJson.trim();
    } catch (e) {
      // It's not valid JSON, so we can't be sure
      console.warn("Could not extract valid JSON from text between first and last braces.");
    }
  }

  // 3. If all else fails, return null
  return null;
}


// MCP工具调用相关辅助函数
async function getMCPServersFromRequest(enabledMcpServers?: MCPServerInfo[]): Promise<MCPServerInfo[]> {
  console.log('getMCPServersFromRequest 输入:', enabledMcpServers);

  if (!enabledMcpServers || enabledMcpServers.length === 0) {
    console.log('没有传入MCP服务器或数组为空');
    return [];
  }

  // 过滤出已启用且已连接的服务器
  const filtered = enabledMcpServers.filter(server => {
    console.log(`检查服务器 ${server.name}: isEnabled=${server.isEnabled}, status=${server.status}, tools=${server.tools?.length || 0}`);
    return server.isEnabled && server.status === 'connected';
  });

  console.log('过滤后的MCP服务器数量:', filtered.length);
  return filtered;
}

async function getMCPTools(mcpServers: MCPServerInfo[]): Promise<OpenAI.Chat.ChatCompletionTool[]> {
  const tools: OpenAI.Chat.ChatCompletionTool[] = [];

  for (const server of mcpServers) {
    if (server.tools && server.status === 'connected') {
      for (const tool of server.tools) {
        // 生成符合OpenAI规范的工具名称（只允许字母、数字、下划线、点和短横线）
        const safeServerName = server.id.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const safeToolName = tool.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const toolName = `${safeServerName}_${safeToolName}`;

        // 验证工具名称符合OpenAI规范
        if (!/^[a-zA-Z0-9_.-]+$/.test(toolName)) {
          console.warn(`跳过不符合命名规范的工具: ${toolName}`);
          continue;
        }

        // 构建详细的工具描述，包含MCP服务器的完整参数信息
        let enhancedDescription = `[来自${server.name}] ${tool.description}`;

        // 根据工具的input_schema自动生成详细的参数说明
        if (tool.input_schema && tool.input_schema.properties) {
          const properties = tool.input_schema.properties as Record<string, any>;
          const requiredFields: string[] = Array.isArray(tool.input_schema.required) ? tool.input_schema.required : [];

          enhancedDescription += '\n\n**参数详情**：';

          Object.entries(properties).forEach(([paramName, paramSchema]) => {
            const isRequired = requiredFields.includes(paramName);
            const requiredText = isRequired ? ' [必需]' : ' [可选]';
            const paramType = paramSchema.type || 'unknown';
            const paramDesc = paramSchema.description || '无描述';
            const defaultValue = paramSchema.default !== undefined ? ` (默认: ${paramSchema.default})` : '';
            const enumValues = paramSchema.enum ? ` (可选值: ${paramSchema.enum.join(', ')})` : '';
            const minMax = [];
            if (paramSchema.minimum !== undefined) minMax.push(`最小: ${paramSchema.minimum}`);
            if (paramSchema.maximum !== undefined) minMax.push(`最大: ${paramSchema.maximum}`);
            const rangeText = minMax.length > 0 ? ` (${minMax.join(', ')})` : '';

            enhancedDescription += `\n- **${paramName}** (${paramType})${requiredText}: ${paramDesc}${defaultValue}${enumValues}${rangeText}`;
          });
        }

        // 为特定工具添加使用示例和重要说明
        if (tool.name === 'get_posts' && server.name.includes('树洞')) {
          enhancedDescription += `\n\n**重要使用说明**：
- 当用户要求搜索特定关键词时，务必在keyword参数中传入该关键词
- keyword参数用于搜索包含该关键词的帖子内容
- 如果用户提到"搜索xxx"、"查找xxx"、"关于xxx的帖子"，请将xxx作为keyword参数
- label参数说明：1-课程心得，2-失物招领，3-求职经历，4-跳蚤市场
- time_start可用于获取指定时间点之后的帖子（Unix时间戳）
- include_replies和include_images控制是否获取回复和图片内容`;
        } else if (tool.name === 'get_followed_posts' && server.name.includes('树洞')) {
          enhancedDescription += `\n\n**使用说明**：
- 获取用户关注的帖子，可按分组筛选
- bookmark_id不指定时获取所有关注的帖子
- 需要有效的用户认证信息`;
        } else if (tool.name === 'get_bookmark_groups' && server.name.includes('树洞')) {
          enhancedDescription += `\n\n**使用说明**：
- 获取用户设置的关注分组列表
- 无需额外参数，但需要有效的用户认证信息`;
        }

        tools.push({
          type: 'function',
          function: {
            name: toolName,
            description: enhancedDescription,
            parameters: tool.input_schema as any || { type: 'object', properties: {} }
          }
        });
      }
    }
  }

  return tools;
}

async function callMCPTool(
  toolName: string,
  toolArguments: string,
  mcpServers: MCPServerInfo[]
): Promise<string> {
  console.log('callMCPTool 调用:', { toolName, mcpServers: mcpServers.map(s => ({ id: s.id, name: s.name })) });

  // 解析工具名称（格式：serverId_toolName）
  const parts = toolName.split('_');
  if (parts.length < 2) {
    throw new Error(`Invalid tool name format: ${toolName}`);
  }

  const serverId = parts[0];
  const actualToolName = parts.slice(1).join('_'); // 处理工具名中可能包含下划线的情况

  console.log('解析工具名称:', { serverId, actualToolName, originalToolName: toolName });

  // 找到对应的MCP服务器（现在使用serverId而不是serverName）
  const server = mcpServers.find(s => {
    const match = s.id === serverId || s.id.replace(/[^a-zA-Z0-9_.-]/g, '_') === serverId;
    console.log(`检查服务器匹配: ${s.id} vs ${serverId}, match: ${match}`);
    return match;
  });

  if (!server) {
    console.error('找不到MCP服务器:', { serverId, availableServers: mcpServers.map(s => s.id) });
    throw new Error(`MCP server not found: ${serverId}. Available servers: ${mcpServers.map(s => s.id).join(', ')}`);
  }

  console.log('找到匹配的服务器:', { id: server.id, name: server.name, baseUrl: server.baseUrl });

  if (!server.baseUrl) {
    throw new Error(`MCP server ${serverId} has no base URL configured`);
  }

  // 验证工具是否存在于服务器中
  const toolExists = server.tools?.some(t => t.name === actualToolName);
  if (!toolExists) {
    console.error('工具不存在:', { actualToolName, availableTools: server.tools?.map(t => t.name) });
    throw new Error(`Tool '${actualToolName}' not found in server '${server.name}'. Available tools: ${server.tools?.map(t => t.name).join(', ') || 'none'}`);
  }

  // 构造MCP调用请求
  const mcpRequest: MCPCallApiRequest = {
    serverId: server.id,
    serverBaseUrl: server.baseUrl,
    toolName: actualToolName,
    arguments: JSON.parse(toolArguments),
    serverConfig: server.config
  };

  console.log('发送MCP请求:', mcpRequest);

  // 调用我们的MCP代理API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mcp/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mcpRequest)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('MCP API调用失败:', errorData);
    throw new Error(`MCP tool call failed: ${errorData.error || response.statusText}`);
  }

  const result: MCPCallApiResponse = await response.json();
  console.log('MCP API响应:', result);

  if (!result.success) {
    throw new Error(`MCP tool call failed: ${result.error}`);
  }

  return JSON.stringify(result.data);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatApiRequest;
    let {
      chatId, messages, modelNativeId, providerId, providerType, clientProvidedApiKey, baseUrl,
      temperature = 0.7, topP, maxTokens, systemPrompt, stop, stream = true, jsonSchema, enableInputPreprocessing,
      enabledMcpServers
    } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    if (!providerType) {
      return NextResponse.json({ error: 'Provider type is required' }, { status: 400 });
    }
    if (!modelNativeId) {
      return NextResponse.json({ error: 'Model Native ID is required' }, { status: 400 });
    }

    if (jsonSchema) {
      const schemaInstruction = `\n\nPlease provide a response in JSON format that strictly adheres to the following JSON Schema. Do not include any other text or explanations outside of the JSON object. The schema is as follows:\n\n${JSON.stringify(jsonSchema, null, 2)}`;
      systemPrompt = systemPrompt ? `${systemPrompt}\n${schemaInstruction}` : schemaInstruction;
    }

    // Apply preprocessing if enabled
    if (enableInputPreprocessing) {
      messages = messages.map(msg => {
        if (msg.role === 'user' && msg.content) {
          if (typeof msg.content === 'string') {
            return { ...msg, content: preprocessInput(msg.content) };
          } else if (Array.isArray(msg.content)) {
            const processedContent = msg.content.map(part => {
              if (part.type === 'text') {
                return { ...part, text: preprocessInput(part.text) };
              }
              return part;
            });
            return { ...msg, content: processedContent };
          }
        }
        return msg;
      });
    }

    const normalizedProviderId = providerId?.replace(/-/g, '_').toUpperCase() || ""; // Used for API key env var lookup
    let apiKeyToUse: string | undefined = process.env[`API_KEY_${normalizedProviderId}`];

    if (!apiKeyToUse && providerType === 'openai') { // OpenAI specific fallback
      apiKeyToUse = process.env.OPENAI_API_KEY;
    } else if (!apiKeyToUse && providerType === 'anthropic') { // Anthropic specific fallback
      apiKeyToUse = process.env.ANTHROPIC_API_KEY;
    } else if (!apiKeyToUse && providerType === 'gemini') { // Gemini specific fallback
      apiKeyToUse = process.env.GEMINI_API_KEY;
    } else if (!apiKeyToUse && providerType === 'siliconflow') { // SiliconFlow specific fallback
      apiKeyToUse = process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY; // SiliconFlow might use its own or OpenAI's
    }

    // If still no API key from env, try client-provided key
    if (!apiKeyToUse && clientProvidedApiKey) {
      console.log(`API key for ${providerId} not found in env, using client-provided key.`);
      apiKeyToUse = clientProvidedApiKey;
    }

    // --- OpenAI, Custom (OpenAI Compatible), or SiliconFlow Provider ---
    if (providerType === 'openai' || providerType === 'custom' || providerType === 'siliconflow') {
      // API key check for non-custom types in this block
      if (!apiKeyToUse && providerType !== 'custom') {
        const envVarNames = `API_KEY_${normalizedProviderId}` + (providerType === 'openai' ? ` or OPENAI_API_KEY` : providerType === 'siliconflow' ? ` or SILICONFLOW_API_KEY/OPENAI_API_KEY` : '');
        console.error(`API key for provider ${providerId} (type: ${providerType}) is not configured. Tried ${envVarNames} and no client-provided key was sufficient.`);

        // 如果是占位符API密钥，返回模拟响应用于测试
        if (process.env.OPENAI_API_KEY === 'sk-test-key-placeholder') {
          console.log(`使用测试模式，流式设置: ${stream}`);

          if (stream) {
            // 流式响应模式 - 打字机效果
            const mockStream = new ReadableStream({
              async start(controller) {
                const send = (chunk: any) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));

                const assistantMsgId = `ai-${Date.now()}`;
                send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });

                const mockResponse = `这是一个测试响应，正在使用流式模式显示。请配置真实的API密钥以使用完整功能。每个字符都会逐个显示，模拟打字机效果。`;

                // 模拟打字机效果 - 增加延迟让效果更明显
                for (let i = 0; i < mockResponse.length; i++) {
                  await new Promise(resolve => setTimeout(resolve, 80)); // 增加到80ms延迟
                  send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: mockResponse[i] });
                }

                send({ id: assistantMsgId, type: 'message_end' });
                controller.close();
              }
            });

            return new Response(mockStream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              }
            });
          } else {
            // 非流式响应模式 - 一次性显示
            const mockStream = new ReadableStream({
              start(controller) {
                const send = (chunk: any) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));

                const assistantMsgId = `ai-${Date.now()}`;
                send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });

                const mockResponse = `这是一个测试响应，正在使用非流式模式显示。请配置真实的API密钥以使用完整功能。整个回复会一次性显示，没有打字机效果。`;

                // 一次性发送完整内容
                send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: mockResponse });
                send({ id: assistantMsgId, type: 'message_end' });
                controller.close();
              }
            });

            return new Response(mockStream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              }
            });
          }
        }

        return NextResponse.json({ error: `API key for provider ${providerId} (type: ${providerType}) is not configured.` }, { status: 500 });
      }

      let effectiveBaseUrl = baseUrl;
      if (providerType === 'openai' && !baseUrl) { // Default for official OpenAI if not overridden
        effectiveBaseUrl = 'https://api.openai.com/v1';
      } else if (providerType === 'siliconflow' && !baseUrl) { // Default for SiliconFlow if not overridden
        effectiveBaseUrl = 'https://api.siliconflow.cn/v1';
      }

      if ((providerType === 'custom' || providerType === 'siliconflow') && !effectiveBaseUrl) {
        console.error(`Base URL is required for '${providerType}' provider type, but not provided for ${providerId}.`);
        return NextResponse.json({ error: `Base URL for provider ${providerId} (type: ${providerType}) is not configured.` }, { status: 500 });
      }

      // For custom type, if no key is found (neither env nor client-provided), we might proceed if it's localhost or warn.
      if (providerType === 'custom' && !apiKeyToUse) {
        if (effectiveBaseUrl && !effectiveBaseUrl.includes('localhost')) {
          console.warn(`API key for custom provider ${providerId} (URL: ${effectiveBaseUrl}) was not found in env or provided by client. Proceeding, but it might fail if the endpoint requires auth.`);
        } else if (effectiveBaseUrl) { // localhost custom endpoint
          console.log(`No API key for custom localhost provider ${providerId}. Assuming no auth needed.`);
        } else { // custom type but no base URL - this is an error caught earlier
          return NextResponse.json({ error: `Base URL for custom provider ${providerId} is not configured.` }, { status: 500 });
        }
      }

      const currentOpenAIClient = new OpenAI({ apiKey: apiKeyToUse || "DUMMY_KEY_FOR_UNAUTH_CUSTOM", baseURL: effectiveBaseUrl }); // SDK might require a string, even if empty for unauth
      if (effectiveBaseUrl) console.log(`Using ${providerType} provider ${providerId} with base URL: ${effectiveBaseUrl}${apiKeyToUse ? " (API Key Provided)" : " (No API Key)"}`);
      else console.log(`Using ${providerType} provider ${providerId} with default SDK base URL.`);

      // 获取MCP服务器和工具 - 只在有启用的服务器时处理
      const mcpServers = await getMCPServersFromRequest(enabledMcpServers);
      const mcpTools = mcpServers.length > 0 ? await getMCPTools(mcpServers) : [];

      console.log(`MCP工具数量: ${mcpTools.length}, 来自${mcpServers.length}个服务器`);

      const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) openAIMessages.push({ role: 'system', content: systemPrompt });
      messages.forEach(msg => {
        if (msg.content || (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) || msg.role === 'tool') {
          const mappedRole = mapRoleToOpenAI(msg.role);
          if (mappedRole === 'system') {
            if (typeof msg.content === 'string') openAIMessages.push({ role: 'system', content: msg.content });
          } else if (mappedRole === 'user') {
            if (typeof msg.content === 'string') {
              openAIMessages.push({ role: 'user', content: msg.content });
            } else if (Array.isArray(msg.content)) {
              const contentParts: Array<OpenAI.Chat.ChatCompletionContentPart> = msg.content.map(part => {
                if (part.type === 'text') {
                  return { type: 'text', text: part.text };
                } else if (part.type === 'image') {
                  return { type: 'image_url', image_url: { url: part.src } };
                }
                // Fallback for unknown parts, though ideally this shouldn't be reached with proper typing
                return { type: 'text', text: '[unsupported content type]' };
              });
              openAIMessages.push({ role: 'user', content: contentParts });
            }
          } else if (mappedRole === 'assistant') {
            if (msg.tool_calls && msg.tool_calls.length > 0) {
              const assistantContent = typeof msg.content === 'string' ? msg.content : null;
              openAIMessages.push({ role: 'assistant', content: assistantContent, tool_calls: msg.tool_calls.map(tc => ({ id: tc.id, type: tc.type, function: { name: tc.function.name, arguments: tc.function.arguments } })) });
            } else {
              if (typeof msg.content === 'string') openAIMessages.push({ role: 'assistant', content: msg.content });
            }
          } else if (mappedRole === 'tool') {
            if (msg.tool_call_id && typeof msg.content === 'string') {
              openAIMessages.push({ role: 'tool', content: msg.content, tool_call_id: msg.tool_call_id });
            } else {
              console.warn("Tool message missing tool_call_id or content is not a string, skipping:", msg);
            }
          }
        }
      });
      try {
        const openaiStream = await currentOpenAIClient.chat.completions.create({
          model: modelNativeId,
          messages: openAIMessages,
          stream: stream, // 使用用户设置的流式参数
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stop: stop, // Added stop parameter
          response_format: jsonSchema ? { type: "json_object" } : undefined,
          tools: mcpTools.length > 0 ? mcpTools : undefined, // 添加MCP工具
        });
        if (stream) {
          // 流式响应处理
          const streamResponse = openaiStream as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
          const readableStream = new ReadableStream({
            async start(controller) {
              const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));
              const assistantMsgId = `ai-${Date.now()}`;
              send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });
              let accumulatedToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];
              let accumulatedContent = "";

              for await (const chunk of streamResponse) {
                const choice = chunk.choices[0];
                if (choice?.delta?.content) {
                  accumulatedContent += choice.delta.content;
                  send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: choice.delta.content });
                }
                if (choice?.delta?.tool_calls) {
                  // Accumulate tool call deltas if they stream piece by piece (some models might)
                  // For OpenAI, tool_calls usually arrive as a complete block in one of the last chunks.
                  choice.delta.tool_calls.forEach((deltaToolCall: any) => {
                    if (deltaToolCall.index === undefined) return; // Should not happen with OpenAI spec

                    if (!accumulatedToolCalls[deltaToolCall.index]) {
                      accumulatedToolCalls[deltaToolCall.index] = { id: "", type: "function", function: { name: "", arguments: "" } };
                    }
                    const currentToolCall = accumulatedToolCalls[deltaToolCall.index];
                    if (deltaToolCall.id) currentToolCall.id = deltaToolCall.id;
                    if (deltaToolCall.function?.name) currentToolCall.function.name += deltaToolCall.function.name;
                    if (deltaToolCall.function?.arguments) currentToolCall.function.arguments += deltaToolCall.function.arguments;
                  });
                }
                // Check if this chunk signals the end of the turn (e.g. for tool calls)
                if (choice?.finish_reason === 'tool_calls') {
                    send({
                      id: assistantMsgId,
                      type: 'tool_calls',
                      tool_calls: accumulatedToolCalls.map(tc => ({
                        id: tc.id!,
                        type: tc.type!,
                        function: {
                          name: tc.function!.name!,
                          arguments: tc.function!.arguments!,
                        }
                      }))
                    });

                    const toolMessages = [];
                    for (const toolCall of accumulatedToolCalls) {
                      try {
                        const serverIdFromTool = toolCall.function!.name!.split('_')[0];
                        const actualServer = mcpServers.find(s => s.id === serverIdFromTool || s.id.replace(/[^a-zA-Z0-9_.-]/g, '_') === serverIdFromTool);

                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_start',
                          tool_call_id: toolCall.id!,
                          tool_name: toolCall.function!.name!,
                          server_name: actualServer?.name || serverIdFromTool
                        });

                        const toolResult = await callMCPTool(
                          toolCall.function!.name!,
                          toolCall.function!.arguments!,
                          mcpServers
                        );

                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_result',
                          tool_call_id: toolCall.id!,
                          result: toolResult
                        });

                        toolMessages.push({
                          role: 'tool' as const,
                          tool_call_id: toolCall.id!,
                          content: toolResult
                        });

                      } catch (error: any) {
                        console.error('MCP工具调用失败:', error);
                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_error',
                          tool_call_id: toolCall.id!,
                          error: error.message || '工具调用失败'
                        });

                        toolMessages.push({
                          role: 'tool' as const,
                          tool_call_id: toolCall.id!,
                          content: JSON.stringify({ error: error.message || '工具调用失败' })
                        });
                      }
                    }

                    send({ id: assistantMsgId, type: 'thinking', thinking: true });

                    const messagesWithToolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [
                      ...openAIMessages,
                      {
                        role: 'assistant' as const,
                        content: accumulatedContent,
                        tool_calls: accumulatedToolCalls
                      },
                      ...toolMessages
                    ];

                    const finalStream = await currentOpenAIClient.chat.completions.create({
                      model: modelNativeId,
                      messages: messagesWithToolResults,
                      stream: true,
                      temperature,
                      max_tokens: maxTokens,
                      top_p: topP,
                      stop: stop,
                      response_format: jsonSchema ? { type: "json_object" } : undefined,
                    });

                    for await (const finalChunk of finalStream) {
                      const finalChoice = finalChunk.choices[0];
                      if (finalChoice?.delta?.content) {
                        send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: finalChoice.delta.content });
                      }

                      if (finalChoice?.finish_reason === 'stop') {
                        break;
                      }
                    }

                    send({ id: assistantMsgId, type: 'thinking', thinking: false });
                    accumulatedToolCalls = [];
                  } else if (choice?.finish_reason === 'stop') {
                  if (jsonSchema && accumulatedContent.trim()) {
                    const extractedJson = extractJsonFromMarkdown(accumulatedContent);
                    if (!extractedJson) {
                      send({
                        id: assistantMsgId,
                        type: 'error',
                        error: {
                          message: "模型输出中未找到有效的JSON内容。",
                          details: `模型原始输出 (前200字符): ${accumulatedContent.substring(0, 200)}...`,
                        }
                      });
                    } else {
                      try {
                        const parsedContent = JSON.parse(extractedJson);
                        const ajv = new Ajv({ allErrors: true });
                        addFormats(ajv);
                        const validate = ajv.compile(jsonSchema);
                        const isValid = validate(parsedContent);

                        if (!isValid) {
                          send({
                            id: assistantMsgId,
                            type: 'error',
                            error: {
                              message: "模型输出不符合自定义的JSON Schema。",
                              details: ajv.errorsText(validate.errors),
                            }
                          });
                        }
                      } catch (parseError) {
                        send({
                          id: assistantMsgId,
                          type: 'error',
                          error: {
                            message: "无法解析提取出的JSON内容，或验证时发生错误。",
                            details: parseError instanceof Error ? parseError.message : String(parseError),
                          }
                        });
                      }
                    }
                  }
                }

              }

              // If loop finishes and there are pending tool calls (e.g. if finish_reason wasn't 'tool_calls' but tool_calls were present)
              // This part might be redundant if OpenAI always sends finish_reason='tool_calls' when tool_calls are present.
              if (accumulatedToolCalls.length > 0) {
                send({
                  id: assistantMsgId,
                  type: 'tool_calls',
                  tool_calls: accumulatedToolCalls.map(tc => ({
                    id: tc.id!, type: tc.type!, function: { name: tc.function!.name!, arguments: tc.function!.arguments! }
                  }))
                });
              }

              send({ id: assistantMsgId, type: 'message_end' }); // Send message_end regardless of tool_calls for this simplified flow
              controller.close();
            }
          });
          return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        } else {
          // 非流式响应处理 - 等待完整响应后一次性返回
          const completion = openaiStream as OpenAI.Chat.Completions.ChatCompletion;
          const assistantMsgId = `ai-${Date.now()}`;

          const responseStream = new ReadableStream({
            start(controller) {
              const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));

              // 发送开始消息
              send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });

              const choice = completion.choices[0];
              if (choice?.message?.content) {
                // 一次性发送完整内容
                send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: choice.message.content });
              }

              // 处理工具调用（如果有）
              if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
                send({
                  id: assistantMsgId,
                  type: 'tool_calls',
                  tool_calls: choice.message.tool_calls.map(tc => ({
                    id: tc.id,
                    type: tc.type,
                    function: {
                      name: tc.function.name,
                      arguments: tc.function.arguments,
                    }
                  }))
                });

                // 处理MCP工具调用 - 非流式模式
                (async () => {
                  try {
                    // 为每个工具调用创建工具结果消息
                    const toolMessages: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

                    for (const toolCall of choice.message.tool_calls!) {
                      try {
                        const serverIdFromTool = toolCall.function.name.split('_')[0];
                        const actualServer = mcpServers.find(s => s.id === serverIdFromTool || s.id.replace(/[^a-zA-Z0-9_.-]/g, '_') === serverIdFromTool);

                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_start',
                          tool_call_id: toolCall.id,
                          tool_name: toolCall.function.name,
                          server_name: actualServer?.name || serverIdFromTool
                        });

                        const toolResult = await callMCPTool(
                          toolCall.function.name,
                          toolCall.function.arguments,
                          mcpServers
                        );

                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_result',
                          tool_call_id: toolCall.id,
                          result: toolResult
                        });

                        // 添加到工具消息数组
                        toolMessages.push({
                          role: 'tool' as const,
                          tool_call_id: toolCall.id,
                          content: toolResult
                        });

                      } catch (error: any) {
                        console.error('MCP工具调用失败:', error);
                        send({
                          id: `tool-${toolCall.id}`,
                          type: 'tool_call_error',
                          tool_call_id: toolCall.id,
                          error: error.message || '工具调用失败'
                        });

                        // 添加错误消息到工具消息数组
                        toolMessages.push({
                          role: 'tool' as const,
                          tool_call_id: toolCall.id,
                          content: JSON.stringify({ error: error.message || '工具调用失败' })
                        });
                      }
                    }

                    // 如果有工具调用，需要再次调用模型获取最终响应
                    if (toolMessages.length > 0) {
                      console.log('工具调用完成，重新请求模型以获取最终响应');

                      // 构建包含工具结果的消息历史
                      const messagesWithToolResults: OpenAI.Chat.ChatCompletionMessageParam[] = [
                        ...openAIMessages,
                        {
                          role: 'assistant' as const,
                          content: choice.message.content,
                          tool_calls: choice.message.tool_calls
                        },
                        ...toolMessages
                      ];

                      // 再次调用模型
                      const finalResponse = await currentOpenAIClient.chat.completions.create({
                        model: modelNativeId,
                        messages: messagesWithToolResults,
                        stream: false,
                        temperature,
                        max_tokens: maxTokens,
                        top_p: topP,
                        stop: stop,
                        response_format: jsonSchema ? { type: "json_object" } : undefined,
                      });

                      const finalChoice = finalResponse.choices[0];
                      if (finalChoice?.message?.content) {
                        // 发送最终响应内容
                        send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: finalChoice.message.content });
                      }
                    }

                    // 发送结束消息
                    send({ id: assistantMsgId, type: 'message_end' });
                    controller.close();
                  } catch (error: any) {
                    console.error('非流式工具调用处理出错:', error);
                    send({ id: assistantMsgId, type: 'message_end' });
                    controller.close();
                  }
                })();
              } else {
                // 没有工具调用，直接结束
                send({ id: assistantMsgId, type: 'message_end' });
                controller.close();
              }
            }
          });

          return new Response(responseStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
        }
      } catch (e: any) { console.error('OpenAI API Error:', e); return NextResponse.json({ error: 'Error with OpenAI: ' + e.message }, { status: 500 }); }

      // --- Anthropic Provider ---
    } else if (providerType === 'anthropic') {
      // apiKeyToUse has been determined by the shared logic at the top
      if (!apiKeyToUse) {
        const envVarNames = `API_KEY_${normalizedProviderId} or ANTHROPIC_API_KEY`;
        console.error(`API key for Anthropic provider ${providerId} is not configured. Tried ${envVarNames} and no client-provided key was sufficient.`);
        return NextResponse.json({ error: `API key for Anthropic provider ${providerId} is not configured.` }, { status: 500 });
      }
      const anthropic = new Anthropic({ apiKey: apiKeyToUse, baseURL: baseUrl });
      const anthropicMessages: Anthropic.Messages.MessageParam[] = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Anthropic only accepts user/assistant roles in messages array
        .map(msg => {
          let content: Anthropic.Messages.MessageParam['content'];
          if (typeof msg.content === 'string') {
            content = msg.content;
          } else if (Array.isArray(msg.content)) {
            content = msg.content.map(part => {
              if (part.type === 'text') {
                return { type: 'text', text: part.text };
              } else if (part.type === 'image' && part.src.startsWith('data:')) {
                const [header, base64Data] = part.src.split(',');
                const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                    data: base64Data,
                  },
                };
              }
              // This case should ideally not be hit with proper typing, but it's a safe fallback.
              return { type: 'text', text: '[unsupported content part]' };
            }).filter(p => p !== null) as (Anthropic.TextBlock | Anthropic.ImageBlockParam)[];
          } else {
            content = ""; // Fallback for empty content
          }
          return { role: mapRoleToAnthropic(msg.role), content };
        });

      // Ensure messages are not empty and handle system prompt
      if (anthropicMessages.length === 0) {
        if (systemPrompt) {
          anthropicMessages.push({ role: 'user', content: systemPrompt }); // Start with system prompt as first user message
        } else {
          return NextResponse.json({ error: 'Anthropic: No user messages to send.' }, { status: 400 });
        }
      }
      // Ensure last message is from user if that's a requirement (often it is)
      if (anthropicMessages[anthropicMessages.length - 1].role === 'assistant') {
        console.warn("Anthropic: Last message was from assistant. This might lead to an error.");
        // Depending on Anthropic's strictness, might need to append a dummy user message or error out.
      }

      try {
        const stream = anthropic.messages.stream({
          model: modelNativeId, // Use modelNativeId
          messages: anthropicMessages,
          system: systemPrompt, // System prompt is a top-level param for Claude 3+
          max_tokens: maxTokens || 4096, // Anthropic requires max_tokens
          temperature,
          top_p: topP,
          stop_sequences: stop // Added stop_sequences
        });
        const readableStream = new ReadableStream({
          async start(controller) {
            const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));
            const assistantMsgId = `ai-${Date.now()}`;
            for await (const event of stream) {
              if (event.type === 'message_start') { send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } }); }
              else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: event.delta.text }); }
              else if (event.type === 'message_stop') { send({ id: assistantMsgId, type: 'message_end' }); controller.close(); break; }
            }
          }
        });
        return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      } catch (e: any) { console.error('Anthropic API Error:', e); return NextResponse.json({ error: 'Error with Anthropic: ' + e.message }, { status: 500 }); }

      // --- Google Gemini Provider ---
    } else if (providerType === 'gemini') {
      // apiKeyToUse has been determined by the shared logic at the top
      if (!apiKeyToUse) {
        const envVarNames = `API_KEY_${normalizedProviderId} or GEMINI_API_KEY`;
        console.error(`API key not found for Gemini provider ${providerId}. Tried ${envVarNames} and no client-provided key was sufficient.`);
        return NextResponse.json({ error: `API key for Gemini provider ${providerId} is not configured.` }, { status: 500 });
      }
      const genAI = new GoogleGenerativeAI(apiKeyToUse);
      const modelInstance = genAI.getGenerativeModel({
        model: modelNativeId, // Use modelNativeId
        systemInstruction: systemPrompt ? { role: "system", parts: [{ text: systemPrompt }] } : undefined,
      });

      let geminiHistory: Content[] = [];
      // For Gemini, system prompt is handled by systemInstruction.
      // History should be alternating user/model.
      messages.forEach(msg => {
        if (msg.content) {
          const currentRole = mapRoleToGemini(msg.role);
          // Basic alternation: if last role is same as current, skip (or merge - complex)
          if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === currentRole) {
            console.warn(`Gemini: Skipping consecutive message with role ${currentRole} to maintain alternation.`);
            return;
          }

          const parts: Part[] = [];
          if (typeof msg.content === 'string') {
            parts.push({ text: msg.content });
          } else if (Array.isArray(msg.content)) {
            msg.content.forEach(part => {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              } else if (part.type === 'image' && part.src.startsWith('data:')) {
                const [header, base64Data] = part.src.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                parts.push({ inlineData: { mimeType, data: base64Data } });
              }
            });
          }

          geminiHistory.push({ role: currentRole, parts });
        }
      });

      // Ensure the last message is from 'user' for generateContentStream if history is not empty
      // If history is empty, the first message to sendMessageStream will be the user prompt.
      if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role !== 'user') {
        console.warn("Gemini: History does not end with a user message. This might be an issue if history is passed to startChat.");
        // For sendMessageStream, the prompt is separate. For startChat, history needs to end with 'model' if prompt is 'user'.
        // The current logic uses startChat and then sendMessageStream with the last user message.
      }

      const lastUserMessageParts: (string | Part)[] = [];
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage && lastUserMessage.content) {
          if (typeof lastUserMessage.content === 'string') {
              lastUserMessageParts.push(lastUserMessage.content);
          } else {
              lastUserMessage.content.forEach(part => {
                  if (part.type === 'text') {
                      lastUserMessageParts.push(part.text);
                  } else if (part.type === 'image' && part.src.startsWith('data:')) {
                      const [header, base64Data] = part.src.split(',');
                      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                      lastUserMessageParts.push({ inlineData: { mimeType, data: base64Data } });
                  }
              });
          }
      }

      if (lastUserMessageParts.length === 0) {
        return NextResponse.json({ error: 'Gemini: No user message content to send.' }, { status: 400 });
      }

      try {
        const chat = modelInstance.startChat({
          history: geminiHistory, // History now does not include the current prompt
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: temperature,
            topP: topP,
            stopSequences: stop // Added stopSequences
          },
        });
        const result = await chat.sendMessageStream(lastUserMessageParts);

        const readableStream = new ReadableStream({
          async start(controller) {
            const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));
            const assistantMsgId = `ai-${Date.now()}`;
            send({ id: assistantMsgId, type: 'message_start', message: { id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });
            for await (const chunk of result.stream) {
              const delta = chunk.text();
              if (delta) {
                send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: delta });
              }
            }
            send({ id: assistantMsgId, type: 'message_end' });
            controller.close();
          }
        });
        return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
      } catch (e: any) { console.error('Gemini API Error:', e); return NextResponse.json({ error: 'Error with Gemini: ' + e.message }, { status: 500 }); }

    } else {
      // --- Fallback to Simulated Stream for unknown providers ---
      console.warn(`Unknown or unconfigured provider: ${providerId}. Falling back to simulated stream.`);
      const simulatedStream = new ReadableStream({ /* ... (simulated stream logic from before) ... */
        async start(controller) {
          const sendChunk = (chunk: ChatStreamChunk) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
          };
          const tempMessageId = `sim-${Date.now().toString(36)}`;
          sendChunk({ id: tempMessageId, type: 'message_start', message: { id: tempMessageId, role: 'assistant', chatId, createdAt: new Date().toISOString() } });
          const lastUserMessage = messages[messages.length - 1]?.content || "your message";
          const simulatedResponse = `(Simulated) Response to "${lastUserMessage}" from model ${modelNativeId || 'unknown_model'}. Provider: ${providerId || 'unknown_provider'}.`;
          for (let i = 0; i < simulatedResponse.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 30));
            sendChunk({ id: tempMessageId, type: 'content_delta', role: 'assistant', content: simulatedResponse[i] });
          }
          sendChunk({ id: tempMessageId, type: 'message_end' });
          controller.close();
        }
      });
      return new Response(simulatedStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
    }

  } catch (error: any) {
    console.error('[CHAT_API_ERROR]', error);
    if (error instanceof SyntaxError) { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    return NextResponse.json({ error: error.message || 'Internal Server Error', details: error }, { status: 500 });
  }
}