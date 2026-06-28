import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Product } from './product.interface.js';

@Injectable()
export class SearchProductsService {
  private readonly logger = new Logger(SearchProductsService.name);
  private products: Product[] = [];

  constructor(private configService: ConfigService) {
    this.loadProducts();
  }

  private loadProducts(): void {
    try {
      const csvPath = this.configService.get<string>('PRODUCTS_CSV_PATH') || 'products_list.csv';
      let fileContent = fs.readFileSync(csvPath, 'utf-8');
      fileContent = fileContent.replace(/(\d)"([ \t])/g, '$1""$2');
      const records: Product[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        skip_records_with_error: true,
      });
      this.products = records;
      this.logger.debug(`Loaded ${this.products.length} products from CSV`);
    } catch (error) {
      this.logger.error(`Failed to load products CSV: ${error.message}`);
      this.products = [];
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  search(query: string): Product[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);

    const scored = this.products.map(product => {
      const titleLower = product.displayTitle.toLowerCase();
      const textLower = product.embeddingText.toLowerCase();
      const typeLower = product.productType.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        const wordRegex = new RegExp('\\b' + this.escapeRegex(term) + '\\b');

        if (wordRegex.test(titleLower)) {
          score += 10;
        } else if (titleLower.includes(term) && term.length >= 4) {
          score += 3;
        }
        if (textLower.includes(term)) {
          score += 3;
        }
        if (typeLower.includes(term)) {
          score += 2;
        }
      }

      return { product, score };
    });

    const filtered = scored.filter(item => item.score > 0);
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, 3).map(item => item.product);
  }
}
