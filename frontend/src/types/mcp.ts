// Based on the MCP specification you might have

export interface MCPParameterSchema {
  type: "string" | "number" | "boolean" | "integer" | "array" | "object";
  description?: string;
  required?: boolean;
  default?: any;
  properties?: Record<string, MCPParameterSchema>; // For object type
  items?: MCPParameterSchema; // For array type
  enum?: any[]; // For restricted set of values
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: MCPParameterSchema; // JSON Schema for tool arguments
  // output_schema?: MCPParameterSchema; // Optional: JSON Schema for tool output
}

// Authentication configuration types
export type MCPAuthType = "none" | "bearer" | "api_key_header" | "api_key_query" | "basic" | "custom_headers";

export interface MCPAuthConfig {
  type: MCPAuthType;
  // For bearer token auth
  bearerToken?: string;
  // For API key authentication
  apiKey?: string;
  apiKeyName?: string; // Header name or query parameter name
  // For basic auth
  username?: string;
  password?: string;
  // For custom headers
  customHeaders?: Record<string, string>;
}

export interface MCPServerInfo {
  id: string; // Unique identifier for the server instance
  name: string; // User-friendly name for the server
  description?: string;
  baseUrl: string; // Base URL of the MCP server
  // Authentication configuration
  authConfig?: MCPAuthConfig;
  // Status information
  status: "connected" | "disconnected" | "error" | "connecting";
  lastChecked?: Date;
  errorDetails?: string;
  // Provided tools by this server
  tools?: MCPToolDefinition[];
  // Provided resources by this server (if applicable)
  // resources?: any[];
  // For UI
  isEnabled?: boolean; // User can enable/disable this server for use in chats
}

export interface MCPToolCallPayload {
  serverName: string; // Name of the MCP server providing the tool
  toolName: string;
  arguments: Record<string, any>; // Arguments ऑब्जेक्ट
}

export interface MCPToolCallResult {
  success: boolean;
  data?: any; // Result data if successful
  error?: string; // Error message if failed
  rawOutput?: string; // Raw output from the tool if needed
}

// For forms or API payloads
export interface MCPServerPayload extends Omit<MCPServerInfo, "id" | "status" | "tools" | "lastChecked" | "errorDetails"> {
  authConfig?: MCPAuthConfig;
}

// --- Types for MCP Tool Call Proxy API ---

export interface MCPCallApiRequest {
  serverId: string; // ID of the MCP Server config (used by client to find baseUrl)
  serverBaseUrl: string; // Base URL of the target MCP server (sent by client)
  toolName: string;
  arguments: Record<string, any>;
  authConfig?: MCPAuthConfig; // Authentication configuration for the MCP server
}

export interface MCPCallApiResponse {
  success: boolean;
  data?: any; // Result from the MCP tool
  error?: string; // Error message if the call failed
  // statusCode?: number; // HTTP status code from the MCP server call
}