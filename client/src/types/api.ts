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
// The original type definition was syntactically incorrect. It has been corrected
// to be a proper union type where each member includes an 'id' field. This 'id'
// corresponds to the message ID and is required by the streaming logic in the API route.
export type ChatStreamChunk =
  | { id: string; type: 'message_start', message: { id: string, role: string, chatId: string, createdAt: string } }
  | { id: string; type: 'content_delta', content: string, role: string }
  | { id: string; type: 'message_end' }
  | { id: string; type: 'tool_calls', tool_calls: any[] }
  | { id: string; type: 'tool_call_start', tool_call_id: string, tool_name: string, server_name: string }
  | { id: string; type: 'tool_call_result', tool_call_id: string, result: any }
  | { id: string; type: 'tool_call_error', tool_call_id: string, error: any }
  | { id: string; type: 'thinking', thinking: boolean }
  | { id: string; type: 'error', error: StreamError };