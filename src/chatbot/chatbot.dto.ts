import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'The user enquiry message for the chatbot',
    example: 'I am looking for a phone',
  })
  @IsString()
  @IsNotEmpty()
  userMessage: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'The final response from the chatbot',
    example: 'Here are some phones we have available...',
  })
  @IsString()
  response: string;
}
