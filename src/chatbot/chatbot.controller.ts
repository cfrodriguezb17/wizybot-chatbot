import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service.js';
import { ChatRequestDto, ChatResponseDto } from './chatbot.dto.js';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to the chatbot',
    description:
      'Processes a user enquiry using Gemini AI with searchProducts and convertCurrencies tools.',
  })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Chatbot response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input - userMessage is required' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    const response = await this.chatbotService.processMessage(chatRequest.userMessage);
    return { response };
  }
}
