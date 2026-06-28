import { Injectable, Inject, Logger } from '@nestjs/common';
import type { LLMProvider } from './llm/llm-provider.interface.js';
import { LLMMessage, LLMResponse, LLM_PROVIDER_TOKEN } from './llm/llm-provider.interface.js';
import { SearchProductsService } from './tools/search-products.service.js';
import { ConvertCurrenciesService } from './tools/convert-currencies.service.js';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @Inject(LLM_PROVIDER_TOKEN)
    private readonly llmProvider: LLMProvider,
    private readonly searchProductsService: SearchProductsService,
    private readonly convertCurrenciesService: ConvertCurrenciesService,
  ) {}

  private readonly systemPrompt = `You are WizyBot, an expert and conversational shopping assistant. Your goal is to help the user find the perfect product.

RULES:
- If the user asks for a gift for someone (dad, mom, friend, etc.), recommend products based on common stereotypes about that person
- IMPORTANT: All product names and descriptions are in English. Before calling searchProducts, translate the search term to English. For example, if the user says "busco un regalo para mi papá", search for "men's gift" or "tools" or "electronics", not "regalo para papa"
- Always give a concrete recommendation instead of saying "I found nothing" — pick the best quality-price option available
- After recommending, ask the user if they are looking for something more specific or what features they prefer
- If the user asks for something generic like "a phone", recommend the best value-for-money model and ask if they want something more specific (range, budget, etc.)
- Always reply in the same language as the user
- Be friendly, natural and conversational`;

  async processMessage(userMessage: string): Promise<string> {
    this.logger.debug(`User message: "${userMessage}"`);

    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      let response: LLMResponse;
      try {
        response = await this.llmProvider.chat(messages);
      } catch (error) {
        this.logger.error(`LLM provider error: ${error.message}`);
        return "I'm sorry, I'm having trouble connecting to my AI provider right now. Please try again later.";
      }

      if (!response.toolCalls || response.toolCalls.length === 0) {
        const finalText = response.text || '';
        this.logger.debug(`Final response: "${finalText}"`);
        return finalText;
      }

      this.logger.debug(
        `LLM requested tools: ${response.toolCalls.map((tc) => `${tc.name}(${JSON.stringify(tc.args)})`).join(', ')}`,
      );

      messages.push({
        role: 'assistant',
        content: response.text,
        toolCalls: response.toolCalls,
      });

      for (const tc of response.toolCalls) {
        const result = await this.executeToolCall(tc.name, tc.args);
        this.logger.debug(`Tool "${tc.name}" result: ${result}`);
        messages.push({
          role: 'tool',
          toolCallId: tc.name,
          content: result,
        });
      }
    }

    throw new Error('Max iterations reached without final response');
  }

  private async executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    switch (name) {
      case 'searchProducts': {
        const query = args['query'] as string;
        const products = this.searchProductsService.search(query);
        if (products.length === 0) {
          return 'No products found matching your query.';
        }
        return products
          .map(
            (p) =>
              `- ${p.displayTitle} | Price: ${p.price}${p.discount === '1' ? ' (On Sale)' : ''} | Category: ${p.productType}${p.variants ? ' | Variants: ' + p.variants : ''}`,
          )
          .join('\n');
      }

      case 'convertCurrencies': {
        const fromCurrency = args['fromCurrency'] as string;
        const toCurrency = args['toCurrency'] as string;
        const amount = args['amount'] as number;
        return await this.convertCurrenciesService.convert(fromCurrency, toCurrency, amount);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
