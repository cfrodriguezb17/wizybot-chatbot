import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from './chatbot.service.js';
import { SearchProductsService } from './tools/search-products.service.js';
import { ConvertCurrenciesService } from './tools/convert-currencies.service.js';
import { LLMProvider, LLMResponse, LLM_PROVIDER_TOKEN } from './llm/llm-provider.interface.js';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let mockSearchProducts: any;
  let mockConvertCurrencies: any;
  let mockProvider: jest.Mocked<LLMProvider>;

  beforeEach(async () => {
    mockSearchProducts = { search: jest.fn() };
    mockConvertCurrencies = { convert: jest.fn() };
    mockProvider = { name: 'test', chat: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: SearchProductsService, useValue: mockSearchProducts },
        { provide: ConvertCurrenciesService, useValue: mockConvertCurrencies },
        { provide: LLM_PROVIDER_TOKEN, useValue: mockProvider },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    jest.clearAllMocks();
  });

  it('should return direct text response when no tool is called', async () => {
    mockProvider.chat.mockResolvedValue({ text: 'Hello! How can I help you today?', toolCalls: null });

    const result = await service.processMessage('Hello');
    expect(result).toBe('Hello! How can I help you today?');
  });

  it('should call searchProducts when LLM requests it and return final response', async () => {
    mockProvider.chat
      .mockResolvedValueOnce({
        text: null,
        toolCalls: [{ name: 'searchProducts', args: { query: 'phone' } }],
      })
      .mockResolvedValueOnce({
        text: 'Here are the phones we have...',
        toolCalls: null,
      });

    mockSearchProducts.search.mockReturnValue([
      { displayTitle: 'iPhone 12', price: '900.0 USD' },
      { displayTitle: 'iPhone 13', price: '1099.0 USD' },
    ]);

    const result = await service.processMessage('I am looking for a phone');
    expect(mockSearchProducts.search).toHaveBeenCalledWith('phone');
    expect(result).toBe('Here are the phones we have...');
  });

  it('should call convertCurrencies when LLM requests it and return final response', async () => {
    mockProvider.chat
      .mockResolvedValueOnce({
        text: null,
        toolCalls: [{ name: 'convertCurrencies', args: { fromCurrency: 'EUR', toCurrency: 'CAD', amount: 350 } }],
      })
      .mockResolvedValueOnce({
        text: '350 Euros is approximately 476 Canadian Dollars.',
        toolCalls: null,
      });

    mockConvertCurrencies.convert.mockResolvedValue('350 EUR = 476 CAD');

    const result = await service.processMessage('How many Canadian Dollars are 350 Euros');
    expect(mockConvertCurrencies.convert).toHaveBeenCalledWith('EUR', 'CAD', 350);
    expect(result).toBe('350 Euros is approximately 476 Canadian Dollars.');
  });

  it('should handle multiple sequential tool calls', async () => {
    mockProvider.chat
      .mockResolvedValueOnce({
        text: null,
        toolCalls: [{ name: 'searchProducts', args: { query: 'watch' } }],
      })
      .mockResolvedValueOnce({
        text: null,
        toolCalls: [{ name: 'convertCurrencies', args: { fromCurrency: 'USD', toCurrency: 'EUR', amount: 350 } }],
      })
      .mockResolvedValueOnce({
        text: 'The watch costs 350 USD, which is about 322 Euros.',
        toolCalls: null,
      });

    mockSearchProducts.search.mockReturnValue([
      { displayTitle: 'Apple Watch Series 8', price: '350.0 USD' },
    ]);
    mockConvertCurrencies.convert.mockResolvedValue('350 USD = 322 EUR');

    const result = await service.processMessage('What is the price of the watch in Euros');
    expect(mockSearchProducts.search).toHaveBeenCalledWith('watch');
    expect(mockConvertCurrencies.convert).toHaveBeenCalledWith('USD', 'EUR', 350);
    expect(result).toBe('The watch costs 350 USD, which is about 322 Euros.');
  });

  it('should return friendly message if LLM provider call fails', async () => {
    mockProvider.chat.mockRejectedValue(new Error('API Error'));

    const result = await service.processMessage('Hello');
    expect(result).toBe("I'm sorry, I'm having trouble connecting to my AI provider right now. Please try again later.");
  });
});
