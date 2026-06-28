import { Injectable, Inject, Logger } from '@nestjs/common';
import type { LLMProvider } from './llm-provider.interface.js';
import { LLMMessage, LLMResponse } from './llm-provider.interface.js';

const COOLDOWN_MS = 15 * 60 * 1000;

@Injectable()
export class FallbackLLMProvider implements LLMProvider {
  readonly name = 'fallback';
  private readonly logger = new Logger(FallbackLLMProvider.name);
  private readonly cooldowns = new Map<string, number>();

  constructor(
    @Inject('OPENAI_PROVIDER') private readonly primary: LLMProvider,
    @Inject('GEMINI_PROVIDER') private readonly secondary: LLMProvider,
  ) {}

  private isOnCooldown(provider: LLMProvider): boolean {
    const until = this.cooldowns.get(provider.name);
    if (!until) return false;
    if (Date.now() >= until) {
      this.cooldowns.delete(provider.name);
      return false;
    }
    const remaining = Math.ceil((until - Date.now()) / 1000);
    this.logger.debug(`${provider.name} on cooldown for ${remaining}s more`);
    return true;
  }

  private setCooldown(provider: LLMProvider): void {
    const until = Date.now() + COOLDOWN_MS;
    this.cooldowns.set(provider.name, until);
    this.logger.warn(`${provider.name} cooldown set until ${new Date(until).toISOString()}`);
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.isOnCooldown(this.primary)) {
      try {
        this.logger.debug(`Attempting primary LLM: ${this.primary.name}`);
        return await this.primary.chat(messages);
      } catch (primaryError) {
        this.logger.warn(
          `Primary LLM (${this.primary.name}) failed: ${primaryError.message}. Falling back to ${this.secondary.name}.`,
        );
        this.setCooldown(this.primary);
      }
    } else {
      this.logger.debug(`Skipping ${this.primary.name} (cooldown), using ${this.secondary.name} directly`);
    }

    try {
      return await this.secondary.chat(messages);
    } catch (secondaryError) {
      this.setCooldown(this.secondary);
      this.logger.error(`Both LLM providers failed. Secondary: ${secondaryError.message}.`);
      throw new Error(
        `All LLM providers failed. Primary (${this.primary.name}) error: cooldown or previous failure. ` +
        `Secondary (${this.secondary.name}) error: ${secondaryError.message}.`,
      );
    }
  }
}
