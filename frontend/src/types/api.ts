// Generic API response structures

export interface ApiResponseError {
  message: string;
  code?: string; // Optional error code
  details?: any; // Additional error details
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Generic success response for mutations (create, update, delete)
export interface MutationSuccessResponse {
  success: boolean;
  id?: string; // ID of the created/updated/deleted resource
  message?: string;
}

// Example: Standard API response wrapper
// You might not need this if your API responses are more direct
export interface StandardApiResponse<T = any> {
  data: T | null;
  error: ApiResponseError | null;
  status: "success" | "error";
  statusCode: number; // HTTP status code
}

// Specific API request/response types can also be defined here
// or co-located with their respective service/feature types.

import type { ToolCall } from "./chat"; // Import ToolCall type

export interface StreamError {
  message: string;
  details?: any;
}

// For streaming chat responses
export interface ChatStreamChunk {
  id: string; // Message ID or chunk ID
  type: "content_delta" | "tool_call_delta" | "tool_calls" | "tool_result" | "message_start" | "message_end" | "error" | "info";
  // For content_delta
  role?: "assistant"; // Typically assistant for deltas
  content?: string; // The delta content
  // For tool_call_delta (individual parts of a tool call, if streamed)
  tool_call_id?: string; // ID of the specific tool call being streamed
  function_name_delta?: string;
  function_args_delta?: string;
  // For tool_calls (a complete set of tool calls from the AI)
  tool_calls?: ToolCall[]; // Array of complete tool call objects
  // For tool_result
  tool_result_content?: string; // Full content of a tool result
  tool_result_name?: string; // Name of the tool that produced the result
  // For message_start
  message?: {
    id: string;
    role: "assistant";
    chatId: string;
    createdAt: string; // ISO string date
  };
  // For error
  error?: StreamError;
  // For info
  info_message?: string;
}