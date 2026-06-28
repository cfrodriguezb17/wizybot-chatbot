import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionToolMessageParam, ChatCompletionMessageFunctionToolCall } from 'openai/resources/chat/completions';
import { OpenAIConfig } from '../openai/openai.config.js';
import { SEARCH_PRODUCTS_TOOL, CONVERT_CURRENCIES_TOOL } from '../openai/function-definitions.js';
import { LLMProvider, LLMMessage, LLMResponse, ToolCall } from './llm-provider.interface.js';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private openaiConfig: OpenAIConfig) {
    this.client = this.openaiConfig.getClient();
    this.model = process.env['OPENAI_MODEL'] || 'gpt-5.4-nano';
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const apiMessages = this.toApiMessages(messages);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: apiMessages,
      tools: [SEARCH_PRODUCTS_TOOL, CONVERT_CURRENCIES_TOOL],
      tool_choice: 'auto',
    });

    const message = response.choices[0]?.message;
    const toolCalls = message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return { text: message.content || null, toolCalls: null };
    }

    const functionToolCalls = toolCalls.filter(
      (tc): tc is ChatCompletionMessageFunctionToolCall => tc.type === 'function',
    );

    return {
      text: message.content || null,
      toolCalls: functionToolCalls.map((tc) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      })),
    };
  }

  private toApiMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = [];

    for (const msg of messages) {
      switch (msg.role) {
        case 'system':
          result.push({ role: 'system', content: msg.content || '' });
          break;

        case 'user':
          result.push({ role: 'user', content: msg.content || '' });
          break;

        case 'assistant': {
          const assistantMsg: ChatCompletionAssistantMessageParam = {
            role: 'assistant',
            content: msg.content || null,
          };
          if (msg.toolCalls && msg.toolCalls.length > 0) {
            assistantMsg.tool_calls = msg.toolCalls.map((tc) => ({
              id: tc.name,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.args),
              },
            }));
          }
          result.push(assistantMsg);
          break;
        }

        case 'tool':
          result.push({
            role: 'tool',
            tool_call_id: msg.toolCallId || '',
            content: msg.content || '',
          });
          break;
      }
    }

    return result;
  }
}
