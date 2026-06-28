export const SEARCH_PRODUCTS_TOOL = {
  type: 'function' as const,
  function: {
    name: 'searchProducts',
    description: 'Search for products in the catalog by keyword relevance. Returns up to 2 matching products with name, price, and description.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find products (e.g. "phone", "present for dad", "watch")',
        },
      },
      required: ['query'],
    },
  },
};

export const CONVERT_CURRENCIES_TOOL = {
  type: 'function' as const,
  function: {
    name: 'convertCurrencies',
    description: 'Convert an amount from one currency to another using the latest exchange rates.',
    parameters: {
      type: 'object',
      properties: {
        fromCurrency: {
          type: 'string',
          description: 'The source currency code (e.g. USD, EUR, CAD, GBP)',
        },
        toCurrency: {
          type: 'string',
          description: 'The target currency code (e.g. USD, EUR, CAD, GBP)',
        },
        amount: {
          type: 'number',
          description: 'The amount to convert',
        },
      },
      required: ['fromCurrency', 'toCurrency', 'amount'],
    },
  },
};
