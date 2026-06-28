import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller.js';
import { ChatbotService } from './chatbot.service.js';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let mockChatbotService: any;

  beforeEach(async () => {
    mockChatbotService = { processMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [
        { provide: ChatbotService, useValue: mockChatbotService },
      ],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
  });

  it('POST /chatbot should return the chatbot response', async () => {
    mockChatbotService.processMessage.mockResolvedValue(
      'Here are some phones we have available.',
    );

    const result = await controller.chat({ userMessage: 'I am looking for a phone' });
    expect(result.response).toBe('Here are some phones we have available.');
    expect(mockChatbotService.processMessage).toHaveBeenCalledWith(
      'I am looking for a phone',
    );
  });

  it('POST /chatbot should handle different enquiries', async () => {
    mockChatbotService.processMessage.mockResolvedValue(
      '350 EUR equals approximately 476 CAD.',
    );

    const result = await controller.chat({
      userMessage: 'How many Canadian Dollars are 350 Euros',
    });
    expect(result.response).toContain('CAD');
    expect(mockChatbotService.processMessage).toHaveBeenCalledWith(
      'How many Canadian Dollars are 350 Euros',
    );
  });
});
