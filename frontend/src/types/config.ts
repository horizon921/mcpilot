export type AIProviderType = "openai" | "anthropic" | "gemini" | "siliconflow" | "custom"; // etc.

export interface AIProvider {
  id: string;
  name: string; // e.g., "OpenAI", "Anthropic"
  type: AIProviderType;
  baseUrl?: string; // For custom providers or self-hosted models
  // Fields for UI hints regarding API key configuration
  apiKeyLabel?: string; // e.g., "OpenAI API Key", "Anthropic API Key"
  apiKeyEnvVar?: string; // e.g., "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "API_KEY_YOUR_PROVIDER_ID"
  apiKeyDocsUrl?: string; // URL to documentation on how to obtain the API key
  // Other provider-specific settings
  // [key: string]: any; // Temporarily commented out to debug settingsStore issue
}

export interface ModelParameter {
  id: string; // e.g., "temperature", "top_p", "max_tokens"
  name: string; // User-friendly name
  description?: string;
  type: "number" | "string" | "boolean" | "integer";
  defaultValue?: number | string | boolean;
  minValue?: number;
  maxValue?: number;
  step?: number; // For number inputs
  options?: Array<{ label: string; value: string | number | boolean }>; // For select inputs
}

export interface AIModel {
  id: string; // e.g., "gpt-4", "claude-3-opus", "gemini-pro"
  name: string; // User-friendly name like "GPT-4 Turbo"
  providerId: string; // Links to an AIProvider
  modelNativeId: string; // The actual ID used by the provider (e.g., "gpt-4-1106-preview")
  description?: string;
  // Common parameters that might be configurable per model
  maxTokens?: number; // Default max output tokens for this model
  supportsStreaming?: boolean;
  supportsSystemPrompt?: boolean;
  supportsToolUse?: boolean;
  // Specific parameters for this model (can override provider defaults or define new ones)
  parameters?: Record<string, any>; // e.g., { temperature: 0.7, top_p: 1.0 }
  // UI hints
  isDefault?: boolean; // Is this the default model for the provider or globally?
  inputSchema?: any; // JSON Schema for input (advanced)
  outputSchema?: any; // JSON Schema for structured output (advanced)
}

export interface AppSettings {
  defaultModelId?: string; // Globally default model if no chat-specific one is set
  defaultTemperature?: number;
  defaultTopP?: number;
  defaultMaxTokens?: number;
  theme: "light" | "dark" | "system";
  // Other global app settings
}

// For forms or API payloads
export interface AIProviderPayload extends Omit<AIProvider, "id"> {}
export interface AIModelPayload extends Omit<AIModel, "id" | "providerId"> {}