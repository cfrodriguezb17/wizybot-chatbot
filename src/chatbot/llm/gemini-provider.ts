import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { GeminiConfig } from '../gemini/gemini.config.js';
import { SEARCH_PRODUCTS_DECLARATION, CONVERT_CURRENCIES_DECLARATION } from '../gemini/function-definitions.js';
import { LLMProvider, LLMMessage, LLMResponse, ToolCall } from './llm-provider.interface.js';

@Injectable()
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly modelName: string;

  constructor(private geminiConfig: GeminiConfig) {
    this.modelName = process.env['GEMINI_MODEL'] || 'gemini-3.1-flash-lite';
    try {
      this.genAI = this.geminiConfig.getClient();
    } catch {
      this.logger.warn('Gemini provider unavailable: GEMINI_API_KEY not configured');
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.genAI) {
      throw new Error('Gemini provider is not available: GEMINI_API_KEY is not configured');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      tools: [
        {
          functionDeclarations: [
            SEARCH_PRODUCTS_DECLARATION,
            CONVERT_CURRENCIES_DECLARATION,
          ],
        },
      ],
    });

    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const history = this.toApiMessages(nonSystemMessages);
    const result = await model.generateContent({
      contents: history,
      systemInstruction: systemMessage?.content || undefined,
    });
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return { text: response.text(), toolCalls: null };
    }

    const parts = candidates[0].content.parts;
    const hasFunctionCall = parts.some((p) => (p as any).functionCall);

    if (!hasFunctionCall) {
      return { text: response.text(), toolCalls: null };
    }

    const toolCalls: ToolCall[] = [];
    for (const part of parts) {
      const fc = (part as any).functionCall;
      if (fc) {
        toolCalls.push({
          name: fc.name,
          args: (fc.args || {}) as Record<string, unknown>,
          thoughtSignature: (part as any).thoughtSignature,
        });
      }
    }

    return { text: null, toolCalls };
  }

  private toApiMessages(messages: LLMMessage[]): Content[] {
    const result: Content[] = [];

    for (const msg of messages) {
      const parts: Part[] = [];

      switch (msg.role) {
        case 'user':
          parts.push({ text: msg.content || '' });
          result.push({ role: 'user', parts });
          break;

        case 'assistant':
          if (msg.toolCalls && msg.toolCalls.length > 0) {
            for (const tc of msg.toolCalls) {
              const part: any = {
                functionCall: {
                  name: tc.name,
                  args: tc.args,
                },
              };
              if (tc.thoughtSignature) {
                part.thoughtSignature = tc.thoughtSignature;
              }
              parts.push(part as Part);
            }
          }
          if (msg.content) {
            parts.push({ text: msg.content });
          }
          result.push({ role: 'model', parts });
          break;

        case 'tool':
          parts.push({
            functionResponse: {
              name: msg.toolCallId || '',
              response: { result: msg.content || '' },
            },
          });
          result.push({ role: 'function', parts });
          break;
      }
    }

    return result;
  }
}
