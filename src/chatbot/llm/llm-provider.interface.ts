export const LLM_PROVIDER_TOKEN = 'LLM_PROVIDER';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  thoughtSignature?: string;
}

export interface LLMResponse {
  text: string | null;
  toolCalls: ToolCall[] | null;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: LLMMessage[]): Promise<LLMResponse>;
}
