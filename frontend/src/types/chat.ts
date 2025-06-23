export interface UserProfile {
  id: string;
  name?: string;
  avatarUrl?: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ToolCall {
  id: string; // Tool call ID, for matching with tool_result
  type: "function"; // Currently only "function" is supported
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  name: string; // The name of the function that was called
  content: string; // Result of the tool call, as a JSON string or plain text
}

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string | null; // Null if there are tool_calls
  createdAt: Date;
  updatedAt?: Date;
  user?: UserProfile; // Optional, for displaying user info if needed
  tool_calls?: ToolCall[];
  tool_call_id?: string; // For tool_result messages, the ID of the original tool_call
  // For UI state:
  isLoading?: boolean;
  error?: string;
  // For future features like message branching/editing
  parentId?: string;
  childrenIds?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Assuming a user context
  // Configuration for this specific chat session
  modelId?: string; // ID of the AI model used
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[]; // New field for stop sequences
  // 新增参数
  presencePenalty?: number;
  frequencyPenalty?: number;
  structuredOutput?: boolean;
  stream?: boolean;
  logitBias?: Record<string, number>;
  user?: string;
  // For MCP integration
  enabledMcpServers?: string[]; // IDs of enabled MCP servers
}

// For API requests/responses if they differ slightly
export interface CreateMessagePayload {
  chatId: string;
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface UpdateMessagePayload {
  content?: string;
  // other fields that can be updated
}