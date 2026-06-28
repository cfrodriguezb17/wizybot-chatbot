import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const SEARCH_PRODUCTS_DECLARATION: FunctionDeclaration = {
  name: 'searchProducts',
  description: 'Search for products in the catalog by keyword relevance. Returns up to 2 matching products with name, price, and description.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: 'The search query to find products (e.g. "phone", "present for dad", "watch")',
      },
    },
    required: ['query'],
  },
};

export const CONVERT_CURRENCIES_DECLARATION: FunctionDeclaration = {
  name: 'convertCurrencies',
  description: 'Convert an amount from one currency to another using the latest exchange rates.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      fromCurrency: {
        type: SchemaType.STRING,
        description: 'The source currency code (e.g. USD, EUR, CAD, GBP)',
      },
      toCurrency: {
        type: SchemaType.STRING,
        description: 'The target currency code (e.g. USD, EUR, CAD, GBP)',
      },
      amount: {
        type: SchemaType.NUMBER,
        description: 'The amount to convert',
      },
    },
    required: ['fromCurrency', 'toCurrency', 'amount'],
  },
};
