export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: unknown;
}

export interface LLMRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export type LLMStopReason =
  | 'end_turn'
  | 'tool_use'
  | 'max_tokens'
  | 'stop_sequence'
  | 'error';

export interface LLMToolCall {
  toolName: string;
  input: unknown;
  callId: string;
}

export interface LLMResponse {
  model: string;
  content: string;
  stopReason: LLMStopReason;
  toolCalls?: LLMToolCall[];
  tokensIn: number;
  tokensOut: number;
  costUsd?: number;
  error?: string;
}

export interface LLMClient {
  complete(req: LLMRequest): Promise<LLMResponse>;
}
