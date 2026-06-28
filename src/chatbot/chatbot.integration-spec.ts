import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { ChatbotService } from './chatbot.service.js';
import { SearchProductsService } from './tools/search-products.service.js';
import { ConvertCurrenciesService } from './tools/convert-currencies.service.js';
import { OpenAIConfig } from './openai/openai.config.js';
import { GeminiConfig } from './gemini/gemini.config.js';
import { OpenAIProvider } from './llm/openai-provider.js';
import { GeminiProvider } from './llm/gemini-provider.js';
import { FallbackLLMProvider } from './llm/fallback-llm-provider.js';
import { LLM_PROVIDER_TOKEN } from './llm/llm-provider.interface.js';

jest.setTimeout(60000);

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return lower.includes('your-') || lower.includes('placeholder') || lower === '';
}

function loadEnvFile(): void {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

function isQuotaError(err: unknown): boolean {
  if (err instanceof Error && err.message.includes('429')) {
    console.warn(`  ⚠ Skipped: OpenAI quota exceeded (429). Message: ${err.message}`);
    return true;
  }
  return false;
}

loadEnvFile();

const OPENAI_KEY = process.env['OPENAI_API_KEY'];
const OER_KEY = process.env['OPEN_EXCHANGE_RATES_APP_ID'];

const openaiConfigured = !isPlaceholder(OPENAI_KEY);
const oerConfigured = !isPlaceholder(OER_KEY);

describe('Chatbot Integration (real APIs)', () => {
  let app: INestApplication;
  let chatbotService: ChatbotService;
  let convertService: ConvertCurrenciesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        ChatbotService,
        SearchProductsService,
        ConvertCurrenciesService,
        OpenAIConfig,
        GeminiConfig,
        { provide: 'OPENAI_PROVIDER', useClass: OpenAIProvider },
        { provide: 'GEMINI_PROVIDER', useClass: GeminiProvider },
        { provide: LLM_PROVIDER_TOKEN, useClass: FallbackLLMProvider },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    chatbotService = module.get<ChatbotService>(ChatbotService);
    convertService = module.get<ConvertCurrenciesService>(ConvertCurrenciesService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('ConvertCurrenciesService (real OER API)', () => {
    (oerConfigured ? test : test.skip)(
      'should convert USD to EUR with real API',
      async () => {
        const result = await convertService.convert('USD', 'EUR', 100);
        expect(result).toContain('100');
        expect(result).toContain('USD');
        expect(result).toContain('EUR');
      },
    );

    (oerConfigured ? test : test.skip)(
      'should convert EUR to CAD with real API',
      async () => {
        const result = await convertService.convert('EUR', 'CAD', 350);
        expect(result).toContain('350');
        expect(result).toContain('EUR');
        expect(result).toContain('CAD');
      },
    );

    (oerConfigured ? test : test.skip)(
      'should throw for invalid currency code',
      async () => {
        await expect(convertService.convert('USD', 'XYZ', 100)).rejects.toThrow(
          'Currency code not found',
        );
      },
    );
  });

  describe('ChatbotService (real OpenAI + tools)', () => {
    (openaiConfigured ? test : test.skip)(
      'should respond to a simple greeting without tools',
      async () => {
        try {
          const result = await chatbotService.processMessage('Hello!');
          expect(result).toBeTruthy();
          expect(result.length).toBeGreaterThan(0);
        } catch (err) {
          if (!isQuotaError(err)) throw err;
        }
      },
    );

    (openaiConfigured ? test : test.skip)(
      'should search products for "I am looking for a phone"',
      async () => {
        try {
          const result = await chatbotService.processMessage('I am looking for a phone');
          expect(result).toBeTruthy();
          expect(result.toLowerCase()).toContain('phone');
        } catch (err) {
          if (!isQuotaError(err)) throw err;
        }
      },
    );

    (openaiConfigured ? test : test.skip)(
      'should search products for "I am looking for a present for my dad"',
      async () => {
        try {
          const result = await chatbotService.processMessage('I am looking for a present for my dad');
          expect(result).toBeTruthy();
          expect(result.length).toBeGreaterThan(0);
        } catch (err) {
          if (!isQuotaError(err)) throw err;
        }
      },
    );

    (openaiConfigured ? test : test.skip)(
      'should convert currencies for "How many Canadian Dollars are 350 Euros"',
      async () => {
        try {
          const result = await chatbotService.processMessage('How many Canadian Dollars are 350 Euros');
          expect(result).toBeTruthy();
          expect(result).toContain('CAD');
          expect(result).toContain('EUR');
        } catch (err) {
          if (!isQuotaError(err)) throw err;
        }
      },
    );

    (openaiConfigured && oerConfigured ? test : test.skip)(
      'should answer "What is the price of the watch in Euros" using search + convert',
      async () => {
        try {
          const result = await chatbotService.processMessage('What is the price of the watch in Euros');
          expect(result).toBeTruthy();
          expect(result.length).toBeGreaterThan(0);
        } catch (err) {
          if (!isQuotaError(err)) throw err;
        }
      },
    );
  });
});
