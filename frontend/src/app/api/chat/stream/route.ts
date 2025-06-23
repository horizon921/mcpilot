import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai'; // Import Gemini SDK
import Ajv, { ValidationError } from "ajv";
import type { Message as ChatMessage, MessageRole } from '@/types/chat';
import type { ChatStreamChunk, StreamError } from '@/types/api';
import type { AIProviderType } from '@/types/config'; // Import AIProviderType

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
  jsonSchema?: Record<string, any>;
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


export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatApiRequest;
    const {
      chatId, messages, modelNativeId, providerId, providerType, clientProvidedApiKey, baseUrl,
      temperature = 0.7, topP, maxTokens, systemPrompt, stop, jsonSchema
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
      
      const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) openAIMessages.push({ role: 'system', content: systemPrompt });
      messages.forEach(msg => {
        if (msg.content || (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) || msg.role === 'tool') {
          const mappedRole = mapRoleToOpenAI(msg.role);
          if (mappedRole === 'system') { if (msg.content) openAIMessages.push({ role: 'system', content: msg.content }); }
          else if (mappedRole === 'user') { if (msg.content) openAIMessages.push({ role: 'user', content: msg.content }); }
          else if (mappedRole === 'assistant') {
            if (msg.tool_calls && msg.tool_calls.length > 0) {
              openAIMessages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls.map(tc => ({ id: tc.id, type: tc.type, function: { name: tc.function.name, arguments: tc.function.arguments } }))});
            } else { if (msg.content) openAIMessages.push({ role: 'assistant', content: msg.content });}
          } else if (mappedRole === 'tool') {
            if (msg.tool_call_id && msg.content) { openAIMessages.push({ role: 'tool', content: msg.content, tool_call_id: msg.tool_call_id }); }
            else { console.warn("Tool message missing tool_call_id or content, skipping:", msg); }
          }
        }
      });
      try {
        const stream = await currentOpenAIClient.chat.completions.create({
          model: modelNativeId,
          messages: openAIMessages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stop: stop, // Added stop parameter
          response_format: jsonSchema ? { type: "json_object" } : undefined,
        });
        const readableStream = new ReadableStream({
          async start(controller) {
            const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));
            const assistantMsgId = `ai-${Date.now()}`;
            send({id: assistantMsgId, type: 'message_start', message: {id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString()}});
            let accumulatedToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];
            let accumulatedContent = "";

            for await (const chunk of stream) {
              const choice = chunk.choices[0];
              if (choice?.delta?.content) {
                accumulatedContent += choice.delta.content;
                send({ id: assistantMsgId, type: 'content_delta', role: 'assistant', content: choice.delta.content });
              }
              if (choice?.delta?.tool_calls) {
                // Accumulate tool call deltas if they stream piece by piece (some models might)
                // For OpenAI, tool_calls usually arrive as a complete block in one of the last chunks.
                choice.delta.tool_calls.forEach(deltaToolCall => {
                  if (deltaToolCall.index === undefined) return; // Should not happen with OpenAI spec

                  if (!accumulatedToolCalls[deltaToolCall.index]) {
                    accumulatedToolCalls[deltaToolCall.index] = { id: "", type: "function", function: { name: "", arguments: "" }};
                  }
                  const currentToolCall = accumulatedToolCalls[deltaToolCall.index];
                  if (deltaToolCall.id) currentToolCall.id = deltaToolCall.id;
                  if (deltaToolCall.function?.name) currentToolCall.function.name += deltaToolCall.function.name;
                  if (deltaToolCall.function?.arguments) currentToolCall.function.arguments += deltaToolCall.function.arguments;
                });
              }
              // Check if this chunk signals the end of the turn (e.g. for tool calls)
              if (choice?.finish_reason === 'tool_calls') {
                // Send accumulated tool calls if any
                if (accumulatedToolCalls.length > 0) {
                  send({
                    id: assistantMsgId,
                    type: 'tool_calls', // New chunk type
                    tool_calls: accumulatedToolCalls.map(tc => ({
                      id: tc.id!, // id should be present by now
                      type: tc.type!, // type should be 'function'
                      function: {
                        name: tc.function!.name!,
                        arguments: tc.function!.arguments!,
                      }
                    }))
                  });
                  accumulatedToolCalls = []; // Reset for safety
                }
              } else if (choice?.finish_reason === 'stop') {
                if (jsonSchema) {
                  try {
                    const parsedContent = JSON.parse(accumulatedContent);
                    const ajv = new Ajv();
                    const validate = ajv.compile(jsonSchema);
                    if (!validate(parsedContent)) {
                      console.error("JSON Schema validation failed:", validate.errors);
                      send({
                        id: assistantMsgId,
                        type: 'error',
                        error: {
                          message: "模型输出不符合自定义的JSON Schema。",
                          details: ajv.errorsText(validate.errors),
                        }
                      });
                    }
                  } catch (e) {
                     console.error("Failed to parse or validate structured output:", e);
                      send({
                        id: assistantMsgId,
                        type: 'error',
                        error: {
                          message: "无法解析模型输出为JSON，或验证时发生错误。",
                          details: e instanceof Error ? e.message : String(e),
                        }
                      });
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

            send({id: assistantMsgId, type: 'message_end'}); // Send message_end regardless of tool_calls for this simplified flow
            controller.close();
          }
        });
        return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }});
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
        .map(msg => ({ role: mapRoleToAnthropic(msg.role), content: msg.content || "" }));
      
      // Ensure messages are not empty and handle system prompt
      if (anthropicMessages.length === 0) {
        if (systemPrompt) {
            anthropicMessages.push({role: 'user', content: systemPrompt }); // Start with system prompt as first user message
        } else {
            return NextResponse.json({ error: 'Anthropic: No user messages to send.' }, { status: 400 });
        }
      }
      // Ensure last message is from user if that's a requirement (often it is)
      if (anthropicMessages[anthropicMessages.length-1].role === 'assistant') {
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
              if (event.type === 'message_start') { send({id: assistantMsgId, type: 'message_start', message: {id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString()}}); }
              else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { send({id: assistantMsgId, type: 'content_delta', role: 'assistant', content: event.delta.text}); }
              else if (event.type === 'message_stop') { send({id: assistantMsgId, type: 'message_end'}); controller.close(); break; }
            }
          }
        });
        return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }});
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
        systemInstruction: systemPrompt ? { role: "system", parts: [{text: systemPrompt}]} : undefined,
      });

      let geminiHistory: Content[] = [];
      // For Gemini, system prompt is handled by systemInstruction.
      // History should be alternating user/model.
      messages.forEach(msg => {
        if (msg.content) {
            const currentRole = mapRoleToGemini(msg.role);
            // Basic alternation: if last role is same as current, skip (or merge - complex)
            if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length -1].role === currentRole) {
                console.warn(`Gemini: Skipping consecutive message with role ${currentRole} to maintain alternation.`);
                return;
            }
            geminiHistory.push({ role: currentRole, parts: [{ text: msg.content }] });
        }
      });
      
      // Ensure the last message is from 'user' for generateContentStream if history is not empty
      // If history is empty, the first message to sendMessageStream will be the user prompt.
      if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role !== 'user') {
          console.warn("Gemini: History does not end with a user message. This might be an issue if history is passed to startChat.");
          // For sendMessageStream, the prompt is separate. For startChat, history needs to end with 'model' if prompt is 'user'.
          // The current logic uses startChat and then sendMessageStream with the last user message.
      }
      
      const lastUserMessageContent = geminiHistory.length > 0 && geminiHistory[geminiHistory.length -1].role === 'user'
                                      ? geminiHistory.pop()!.parts[0].text // Pop last user message to use as prompt
                                      : messages.filter(m=>m.role==='user').pop()?.content || "Hello"; // Fallback if history is empty or ends with model

      if (!lastUserMessageContent) {
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
        const result = await chat.sendMessageStream(lastUserMessageContent);

        const readableStream = new ReadableStream({
          async start(controller) {
            const send = (c: ChatStreamChunk) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(c)}\n\n`));
            const assistantMsgId = `ai-${Date.now()}`;
            send({id: assistantMsgId, type: 'message_start', message: {id: assistantMsgId, role: 'assistant', chatId, createdAt: new Date().toISOString()}});
            for await (const chunk of result.stream) {
              const delta = chunk.text();
              if (delta) {
                send({id: assistantMsgId, type: 'content_delta', role: 'assistant', content: delta});
              }
            }
            send({id: assistantMsgId, type: 'message_end'});
            controller.close();
          }
        });
        return new Response(readableStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }});
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
            sendChunk({id: tempMessageId, type: 'message_start', message: {id: tempMessageId, role: 'assistant', chatId, createdAt: new Date().toISOString()}});
            const lastUserMessage = messages[messages.length - 1]?.content || "your message";
            const simulatedResponse = `(Simulated) Response to "${lastUserMessage}" from model ${modelNativeId || 'unknown_model'}. Provider: ${providerId || 'unknown_provider'}.`;
            for (let i = 0; i < simulatedResponse.length; i++) {
              await new Promise(resolve => setTimeout(resolve, 30));
              sendChunk({id: tempMessageId, type: 'content_delta', role: 'assistant', content: simulatedResponse[i]});
            }
            sendChunk({id: tempMessageId, type: 'message_end'});
            controller.close();
          }
      });
      return new Response(simulatedStream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }});
    }

  } catch (error: any) {
    console.error('[CHAT_API_ERROR]', error);
    if (error instanceof SyntaxError) { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    return NextResponse.json({ error: error.message || 'Internal Server Error', details: error }, { status: 500 });
  }
}