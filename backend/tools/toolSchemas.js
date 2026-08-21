/**
 * Tool Schemas
 *
 * JSON schema definitions for every action the AI agent can invoke.
 * These are injected into the LLM system prompt so the model knows
 * exactly which tools are available and how to call them.
 */

export const toolSchemas = [
  {
    name: 'add_item_to_db',
    description:
      "Add a new item to the user's shopping list. Infer the category automatically from the item name.",
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item (e.g., "organic whole milk")' },
        category: {
          type: 'string',
          enum: ['dairy', 'produce', 'meat', 'bakery', 'beverages', 'snacks', 'frozen', 'household', 'personal_care', 'other'],
          description: 'Category — infer from item name',
        },
        quantity: { type: 'number', description: 'Numeric quantity (default 1)' },
        unit: {
          type: 'string',
          description: 'Measurement unit (e.g., kg, litre, bottle, pack, piece)',
        },
      },
      required: ['name', 'category'],
    },
  },
  {
    name: 'remove_item_from_db',
    description: "Remove an item from the user's shopping list by name (fuzzy match is fine).",
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item to remove' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_item_quantity',
    description: 'Update the quantity (and optionally unit) of an existing item.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item' },
        quantity: { type: 'number', description: 'New quantity' },
        unit: { type: 'string', description: 'New unit (optional)' },
      },
      required: ['name', 'quantity'],
    },
  },
  {
    name: 'mark_item_complete',
    description: 'Mark an item as purchased / checked off.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_catalog',
    description:
      'Search the product catalog for items matching a query, with optional price and brand filters.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        maxPrice: { type: 'number', description: 'Maximum price filter' },
        brand: { type: 'string', description: 'Brand name filter' },
        category: {
          type: 'string',
          enum: ['dairy', 'produce', 'meat', 'bakery', 'beverages', 'snacks', 'frozen', 'household', 'personal_care', 'other'],
          description: 'Category filter',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_suggestions',
    description:
      "Get smart product suggestions based on the user's shopping history and current season.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_shopping_list',
    description: "Retrieve the user's current (non-completed) shopping list.",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
