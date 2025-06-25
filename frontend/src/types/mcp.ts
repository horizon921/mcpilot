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

// Dynamic parameter configuration types
export interface MCPParameterDefinition {
  name: string;               // 参数的内部名称
  label: string;              // UI中显示的友好名称
  type: "string" | "password" | "boolean" | "select" | "number";
  description?: string;       // 参数的简短描述或提示
  required: boolean;          // 是否为必需参数
  location: "header" | "query" | "body_json"; // 参数应该放在哪里
  header_name?: string;       // 如果location是header，实际的HTTP头部名称
  query_name?: string;        // 如果location是query，URL参数名称
  options?: string[];         // 如果type是select，可选值列表
  placeholder?: string;       // 输入框的占位符文本
}

export interface MCPConfigSchema {
  server_name: string;
  description?: string;
  parameters: MCPParameterDefinition[];
}

export interface MCPServerConfig {
  // 用户配置的参数值，以参数name为键
  parameters: Record<string, any>;
}

export interface MCPServerInfo {
  id: string; // Unique identifier for the server instance
  name: string; // User-friendly name for the server
  description?: string;
  baseUrl: string; // Base URL of the MCP server
  // Dynamic server configuration
  configSchema?: MCPConfigSchema; // Server's parameter schema
  config?: MCPServerConfig; // User's configured parameter values
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
export interface MCPServerPayload extends Omit<MCPServerInfo, "id" | "status" | "tools" | "lastChecked" | "errorDetails"> {}

// --- Types for MCP Tool Call Proxy API ---

export interface MCPCallApiRequest {
  serverId: string; // ID of the MCP Server config (used by client to find baseUrl)
  serverBaseUrl: string; // Base URL of the target MCP server (sent by client)
  toolName: string;
  arguments: Record<string, any>;
  serverConfig?: MCPServerConfig; // Server configuration with dynamic parameters
}

export interface MCPCallApiResponse {
  success: boolean;
  data?: any; // Result from the MCP tool
  error?: string; // Error message if the call failed
  // statusCode?: number; // HTTP status code from the MCP server call
}