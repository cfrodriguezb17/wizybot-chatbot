import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ExchangeRatesResponse {
  rates: Record<string, number>;
}

@Injectable()
export class ConvertCurrenciesService {
  private readonly logger = new Logger(ConvertCurrenciesService.name);

  constructor(private configService: ConfigService) {}

  async convert(fromCurrency: string, toCurrency: string, amount: number): Promise<string> {
    const appId = this.configService.get<string>('OPEN_EXCHANGE_RATES_APP_ID');

    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data: ExchangeRatesResponse = await response.json();
    const rates = data.rates;

    const fromRate = rates[fromCurrency.toUpperCase()];
    const toRate = rates[toCurrency.toUpperCase()];

    if (!fromRate) {
      throw new Error(`Currency code not found: ${fromCurrency}`);
    }
    if (!toRate) {
      throw new Error(`Currency code not found: ${toCurrency}`);
    }

    const convertedAmount = (amount / fromRate) * toRate;
    const formattedAmount = convertedAmount % 1 === 0
      ? convertedAmount.toFixed(0)
      : convertedAmount.toFixed(2);

    return `${amount} ${fromCurrency.toUpperCase()} = ${formattedAmount} ${toCurrency.toUpperCase()}`;
  }
}
