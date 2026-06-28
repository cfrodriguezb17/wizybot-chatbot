import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller.js';
import { ChatbotService } from './chatbot.service.js';
import { SearchProductsService } from './tools/search-products.service.js';
import { ConvertCurrenciesService } from './tools/convert-currencies.service.js';
import { OpenAIConfig } from './openai/openai.config.js';
import { GeminiConfig } from './gemini/gemini.config.js';
import { OpenAIProvider } from './llm/openai-provider.js';
import { GeminiProvider } from './llm/gemini-provider.js';
import { FallbackLLMProvider } from './llm/fallback-llm-provider.js';
import { LLM_PROVIDER_TOKEN } from './llm/llm-provider.interface.js';

@Module({
  controllers: [ChatbotController],
  providers: [
    OpenAIConfig,
    GeminiConfig,
    { provide: 'OPENAI_PROVIDER', useClass: OpenAIProvider },
    { provide: 'GEMINI_PROVIDER', useClass: GeminiProvider },
    { provide: LLM_PROVIDER_TOKEN, useClass: FallbackLLMProvider },
    ChatbotService,
    SearchProductsService,
    ConvertCurrenciesService,
  ],
})
export class ChatbotModule {}
