import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiConfig {
  private readonly logger = new Logger(GeminiConfig.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey.toLowerCase().includes('your-')) {
      this.logger.warn('GEMINI_API_KEY not configured. Gemini provider will be unavailable.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return this.genAI;
  }
}
