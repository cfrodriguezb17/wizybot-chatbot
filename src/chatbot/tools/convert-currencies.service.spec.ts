import { Test, TestingModule } from '@nestjs/testing';
import { ConvertCurrenciesService } from './convert-currencies.service.js';
import { ConfigService } from '@nestjs/config';

const mockRatesResponse = {
  rates: {
    USD: 1,
    EUR: 0.92,
    CAD: 1.36,
    GBP: 0.79,
  },
};

describe('ConvertCurrenciesService', () => {
  let service: ConvertCurrenciesService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-app-id'),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConvertCurrenciesService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ConvertCurrenciesService>(ConvertCurrenciesService);
  });

  describe('convert', () => {
    it('should convert USD to EUR correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRatesResponse,
      });

      const result = await service.convert('USD', 'EUR', 100);
      expect(result).toContain('100');
      expect(result).toContain('USD');
      expect(result).toContain('EUR');
      expect(result).toContain('92');
    });

    it('should convert EUR to CAD correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRatesResponse,
      });

      const result = await service.convert('EUR', 'CAD', 350);
      expect(result).toContain('350');
      expect(result).toContain('EUR');
      expect(result).toContain('CAD');
    });

    it('should handle API failure gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Forbidden',
      });

      await expect(service.convert('USD', 'EUR', 100)).rejects.toThrow(
        'Failed to fetch exchange rates',
      );
    });

    it('should throw error for unknown currency code', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRatesResponse,
      });

      await expect(service.convert('USD', 'XYZ', 100)).rejects.toThrow(
        'Currency code not found',
      );
    });

    it('should handle zero amount', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRatesResponse,
      });

      const result = await service.convert('USD', 'EUR', 0);
      expect(result).toContain('0');
    });
  });
});
