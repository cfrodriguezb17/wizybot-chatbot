import { Test, TestingModule } from '@nestjs/testing';
import { FallbackLLMProvider } from './fallback-llm-provider.js';
import { LLMProvider, LLMMessage } from './llm-provider.interface.js';

describe('FallbackLLMProvider', () => {
  let provider: FallbackLLMProvider;
  let mockPrimary: jest.Mocked<LLMProvider>;
  let mockSecondary: jest.Mocked<LLMProvider>;
  const testMessages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];

  beforeEach(async () => {
    mockPrimary = { name: 'primary', chat: jest.fn() };
    mockSecondary = { name: 'secondary', chat: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackLLMProvider,
        { provide: 'OPENAI_PROVIDER', useValue: mockPrimary },
        { provide: 'GEMINI_PROVIDER', useValue: mockSecondary },
      ],
    }).compile();

    provider = module.get<FallbackLLMProvider>(FallbackLLMProvider);
  });

  it('should return primary result when primary succeeds', async () => {
    mockPrimary.chat.mockResolvedValue({ text: 'Hello!', toolCalls: null });

    const result = await provider.chat(testMessages);

    expect(result).toEqual({ text: 'Hello!', toolCalls: null });
    expect(mockPrimary.chat).toHaveBeenCalledWith(testMessages);
    expect(mockSecondary.chat).not.toHaveBeenCalled();
  });

  it('should fall back to secondary when primary fails', async () => {
    mockPrimary.chat.mockRejectedValue(new Error('Primary 429 quota exceeded'));
    mockSecondary.chat.mockResolvedValue({ text: 'Secondary response!', toolCalls: null });

    const result = await provider.chat(testMessages);

    expect(result).toEqual({ text: 'Secondary response!', toolCalls: null });
    expect(mockPrimary.chat).toHaveBeenCalledWith(testMessages);
    expect(mockSecondary.chat).toHaveBeenCalledWith(testMessages);
  });

  it('should throw combined error when both providers fail', async () => {
    mockPrimary.chat.mockRejectedValue(new Error('Primary error'));
    mockSecondary.chat.mockRejectedValue(new Error('Secondary error'));

    await expect(provider.chat(testMessages)).rejects.toThrow(
      'All LLM providers failed. Primary (primary) error: cooldown or previous failure. Secondary (secondary) error: Secondary error.',
    );
  });
});
