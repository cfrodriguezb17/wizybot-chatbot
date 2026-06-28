import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { SearchProductsService } from './search-products.service.js';
import { ConfigService } from '@nestjs/config';

describe('SearchProductsService', () => {
  let service: SearchProductsService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(path.resolve(__dirname, '../../../test/fixtures/products-sample.csv')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchProductsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SearchProductsService>(SearchProductsService);
  });

  describe('search', () => {
    it('should return top 3 matching products by keyword', () => {
      const results = service.search('phone');
      expect(results).toHaveLength(2);
      expect(results[0].displayTitle).toContain('iPhone');
    });

    it('should return empty array if no match is found', () => {
      const results = service.search('nonexistentproductxyz');
      expect(results).toEqual([]);
    });

    it('should return products with matching title first', () => {
      const results = service.search('iPhone');
      expect(results).toHaveLength(2);
      expect(results.every(p => p.displayTitle.includes('iPhone'))).toBeTruthy();
    });

    it('should be case-insensitive', () => {
      const resultsLower = service.search('phone');
      const resultsUpper = service.search('PHONE');
      expect(resultsLower).toEqual(resultsUpper);
    });

    it('should match keywords in embeddingText', () => {
      const results = service.search('gaming');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.displayTitle.includes('Chromebook') || p.displayTitle.includes('PlayStation'))).toBeTruthy();
    });

    it('should return empty array for empty query', () => {
      const results = service.search('');
      expect(results).toEqual([]);
    });
  });
});
