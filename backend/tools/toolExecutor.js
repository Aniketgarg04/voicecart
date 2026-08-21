import { ShoppingItem } from '../models/ShoppingItem.js';
import ProductCatalog from '../models/ProductCatalog.js';

/**
 * Tool Executor
 *
 * Receives tool calls from the AI agent and performs the actual
 * MongoDB operations. Returns structured results that are fed back
 * into the conversation so the LLM can continue reasoning.
 */
export async function executeTool(toolName, params = {}, userId = 'local-dev-user') {
  const cleanParams = sanitizeParams(params);

  switch (toolName) {
    case 'add_item_to_db':
      return addItem(cleanParams, userId);
    case 'remove_item_from_db':
      return removeItem(cleanParams, userId);
    case 'update_item_quantity':
      return updateQuantity(cleanParams, userId);
    case 'mark_item_complete':
      return markComplete(cleanParams, userId);
    case 'unmark_item':
      return unmarkItem(cleanParams, userId);
    case 'clear_completed_items':
      return clearCompleted(userId);
    case 'clear_all_items':
      return clearAll(userId);
    case 'check_item_stock':
      return checkItemStock(cleanParams);
    case 'search_catalog':
      return searchCatalog(cleanParams);
    case 'get_suggestions':
      return getSuggestions(userId);
    case 'get_shopping_list':
      return getShoppingList(userId);
    case 'navigate_to_checkout':
      return { success: true, action: 'navigate_checkout', message: 'Navigated to checkout page.' };
    case 'generate_bill':
      return { success: true, action: 'generate_bill', message: 'Generated bill and triggered download.' };
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// ── Tool Implementations ──────────────────────────────────────────────────────

async function addItem({ name, category = 'other', quantity = 1, unit = 'piece', notes = '' }, userId) {
  try {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = name.trim();
    
    // Check if item is in catalog and out of stock
    const catalogItem = await ProductCatalog.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') }
    });
    if (catalogItem && catalogItem.inStock === false) {
      return {
        success: false,
        outOfStock: true,
        itemName: catalogItem.name,
        substitutes: catalogItem.substitutes || [],
        error: `${catalogItem.name} is currently out of stock.`,
      };
    }

    const cleanCat  = sanitizeCategory(category, cleanName);
    const cleanQty  = Math.max(1, Number(quantity) || 1);
    const cleanUnit = typeof unit === 'string' && unit.trim() ? unit.trim() : 'piece';

    const item = await ShoppingItem.findOneAndUpdate(
      { userId, name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') } },
      {
        $set: {
          category: cleanCat,
          quantity: cleanQty,
          unit: cleanUnit,
          isCompleted: false,
          notes: typeof notes === 'string' ? notes.trim() : '',
        },
        $setOnInsert: {
          name: cleanName,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    return { success: true, action: 'added', item };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function removeItem({ name }, userId) {
  try {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = name.trim();
    const result = await ShoppingItem.findOneAndDelete({
      userId,
      name: { $regex: new RegExp(escapeRegex(cleanName), 'i') },
    });
    if (!result) return { success: false, error: `Item "${cleanName}" not found in your list` };
    return { success: true, action: 'removed', item: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function updateQuantity({ name, quantity, unit }, userId) {
  try {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = name.trim();
    const cleanQty = Math.max(1, Number(quantity) || 1);
    const update = { quantity: cleanQty };
    if (unit && typeof unit === 'string') update.unit = unit.trim();

    const item = await ShoppingItem.findOneAndUpdate(
      { userId, name: { $regex: new RegExp(escapeRegex(cleanName), 'i') } },
      { $set: update },
      { new: true }
    );
    if (!item) return { success: false, error: `Item "${cleanName}" not found` };
    return { success: true, action: 'updated', item };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function markComplete({ name }, userId) {
  try {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = name.trim();
    const item = await ShoppingItem.findOneAndUpdate(
      { userId, name: { $regex: new RegExp(escapeRegex(cleanName), 'i') } },
      { $set: { isCompleted: true } },
      { new: true }
    );
    if (!item) return { success: false, error: `Item "${cleanName}" not found` };
    return { success: true, action: 'completed', item };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function unmarkItem({ name }, userId) {
  try {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = name.trim();
    const item = await ShoppingItem.findOneAndUpdate(
      { userId, name: { $regex: new RegExp(escapeRegex(cleanName), 'i') } },
      { $set: { isCompleted: false } },
      { new: true }
    );
    if (!item) return { success: false, error: `Item "${cleanName}" not found` };
    return { success: true, action: 'unmarked', item };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function clearCompleted(userId) {
  try {
    const result = await ShoppingItem.deleteMany({ userId, isCompleted: true });
    return { success: true, action: 'cleared_completed', count: result.deletedCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function clearAll(userId) {
  try {
    const result = await ShoppingItem.deleteMany({ userId });
    return { success: true, action: 'cleared_all', count: result.deletedCount };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function checkItemStock({ name }) {
  try {
    if (!name || typeof name !== 'string') {
      return { success: false, error: 'Item name is required' };
    }
    const cleanName = name.trim();
    const catalogItem = await ProductCatalog.findOne({
      name: { $regex: new RegExp(escapeRegex(cleanName), 'i') }
    });
    if (!catalogItem) {
      return { success: true, found: false, message: `${cleanName} is not in our catalog.` };
    }
    return {
      success: true,
      found: true,
      inStock: catalogItem.inStock !== false,
      itemName: catalogItem.name,
      price: catalogItem.price,
      substitutes: catalogItem.substitutes || [],
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function searchCatalog({ query, maxPrice, brand, category }) {
  try {
    const q = (typeof query === 'string' ? query : '').trim();
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: new RegExp(escapeRegex(q), 'i') } },
        { brand: { $regex: new RegExp(escapeRegex(q), 'i') } },
        { tags: { $in: [new RegExp(escapeRegex(q), 'i')] } },
      ];
    }

    if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
      filter.price = { $lte: Number(maxPrice) };
    }
    if (brand && typeof brand === 'string') {
      filter.brand = { $regex: new RegExp(escapeRegex(brand.trim()), 'i') };
    }
    if (category && typeof category === 'string') {
      filter.category = category.trim();
    }

    const results = await ProductCatalog.find(filter)
      .sort({ price: 1 })
      .limit(12)
      .lean();

    return {
      success: true,
      count: results.length,
      results,
    };
  } catch (err) {
    return { success: false, error: err.message, results: [] };
  }
}

async function getSuggestions(userId) {
  try {
    const currentItems = await ShoppingItem.find({ userId, isCompleted: false }).lean();
    const currentNames = new Set(currentItems.map((i) => (i.name || '').toLowerCase()));

    const currentMonth = new Date().getMonth() + 1;

    // 1. Seasonal items for this month
    const seasonal = await ProductCatalog.find({
      isSeasonal: true,
      seasonMonths: currentMonth,
    })
      .limit(6)
      .lean();

    // 2. Popular essentials
    const staples = await ProductCatalog.find({
      category: { $in: ['dairy', 'produce', 'bakery', 'beverages'] },
    })
      .limit(8)
      .lean();

    const merged = [...seasonal, ...staples]
      .filter((p) => !currentNames.has((p.name || '').toLowerCase()))
      .reduce((acc, p) => {
        if (!acc.find((x) => x._id.toString() === p._id.toString())) acc.push(p);
        return acc;
      }, [])
      .slice(0, 8);

    return { success: true, suggestions: merged };
  } catch (err) {
    return { success: false, error: err.message, suggestions: [] };
  }
}

async function getShoppingList(userId) {
  try {
    const items = await ShoppingItem.find({ userId, isCompleted: false })
      .sort({ category: 1, createdAt: -1 })
      .lean();
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message, items: [] };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeParams(raw) {
  if (!raw || typeof raw !== 'object') return {};
  let clean = { ...raw };

  if (clean.properties && typeof clean.properties === 'object') {
    clean = { ...clean.properties };
  }

  // Flatten nested value objects
  const out = {};
  for (const [k, v] of Object.entries(clean)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[k] = v.value || v.default || v.name || '';
    } else {
      out[k] = v;
    }
  }

  return out;
}

const VALID_CATEGORIES = new Set([
  'dairy',
  'produce',
  'meat',
  'bakery',
  'beverages',
  'snacks',
  'frozen',
  'household',
  'personal_care',
  'other',
]);

function sanitizeCategory(cat, name = '') {
  if (typeof cat === 'string' && VALID_CATEGORIES.has(cat.toLowerCase().trim())) {
    return cat.toLowerCase().trim();
  }

  // Infer category from item name
  const n = name.toLowerCase();
  if (/milk|cheese|yogurt|butter|cream|dairy|egg/i.test(n)) return 'dairy';
  if (/apple|banana|orange|avocado|tomato|lettuce|broccoli|carrot|onion|potato|fruit|vegetable|berry|spinach/i.test(n)) return 'produce';
  if (/chicken|beef|pork|steak|fish|salmon|shrimp|meat|bacon|turkey/i.test(n)) return 'meat';
  if (/bread|bagel|croissant|muffin|bakery|sourdough|cake|cookie/i.test(n)) return 'bakery';
  if (/coffee|tea|juice|soda|water|beverage|drink|beer|wine/i.test(n)) return 'beverages';
  if (/chip|cracker|nut|popcorn|snack|chocolate|candy/i.test(n)) return 'snacks';
  if (/frozen|ice cream|pizza/i.test(n)) return 'frozen';
  if (/soap|detergent|paper|clean|trash|foil|household/i.test(n)) return 'household';
  if (/shampoo|toothpaste|lotion|brush|care/i.test(n)) return 'personal_care';
  return 'other';
}

function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
