/**
 * AI Service — Hybrid Adapter
 *
 * AI_PROVIDER=ollama    → Local Ollama (gemma:2b by default) — zero API cost
 * AI_PROVIDER=openai    → OpenAI Chat API (set OPENAI_API_KEY + OPENAI_MODEL)
 *
 * The adapter normalises both providers to a single interface:
 *   processCommand(conversationHistory, userId) → { thought, toolCall, message, suggestions }
 */

import { Ollama } from 'ollama';
import OpenAI from 'openai';

const PROVIDER = process.env.AI_PROVIDER || 'ollama';

// ── Provider Clients ──────────────────────────────────────────────────────────

const ollamaClient =
  PROVIDER === 'ollama'
    ? new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' })
    : null;

const openaiClient =
  PROVIDER === 'openai'
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      })
    : null;

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are VoiceCart, a smart AI grocery shopping assistant. You help users manage their grocery list entirely through natural language and voice commands.

CRITICAL INSTRUCTIONS:
1. Always reply with a SINGLE valid JSON object. No markdown fences, no extra text.
2. In "tool_call.parameters", ALWAYS output concrete values (strings/numbers). NEVER output schema definitions.
3. Always pick a valid category: "dairy", "produce", "meat", "bakery", "beverages", "snacks", "frozen", "household", "personal_care", "other".
4. When the user wants to add, remove, update, check, or search for items → you MUST use a tool_call.
5. Keep the "message" field friendly, concise, and conversational. Max 1-2 sentences.
6. If a tool returns outOfStock=true, inform the user clearly and suggest the listed substitutes.
7. If a tool returns an error, tell the user what went wrong in plain language.

AVAILABLE TOOLS:
- add_item_to_db: { "name": "Milk", "category": "dairy", "quantity": 2, "unit": "litre" }
  Use when user wants to add or buy something.

- remove_item_from_db: { "name": "Milk" }
  Use when user says remove, delete, take off, I don't need, etc.

- update_item_quantity: { "name": "Milk", "quantity": 3, "unit": "litre" }
  Use when user wants to change the quantity or unit of an existing item.

- mark_item_complete: { "name": "Milk" }
  Use when user says "I got milk", "bought milk", "check off milk", "got it", etc.

- unmark_item: { "name": "Milk" }
  Use when user says "uncheck", "I still need", "add back", etc. for a done item.

- clear_completed_items: {}
  Use when user says "clear done items", "remove checked items", "clean up list", etc.

- clear_all_items: {}
  Use when user says "clear everything", "empty my list", "start fresh", etc.

- check_item_stock: { "name": "Milk" }
  Use when user asks "is X in stock?", "do you have X?", "is X available?".

- search_catalog: { "query": "organic milk", "maxPrice": 5, "category": "dairy" }
  Use when user wants to search or find products by name, price, brand, or category.

- get_suggestions: {}
  Use when user says "what should I buy?", "surprise me", "what's in season?", etc.

- get_shopping_list: {}
  Use when user says "what's on my list?", "show my cart", "read my list", etc.

- navigate_to_checkout: {}
  Use when user says "go to checkout", "take me to pay", "I'm ready to pay", etc.

- generate_bill: {}
  Use when user says "generate my bill", "create invoice", "download receipt", "pay now", etc.

JSON RESPONSE FORMAT:
{
  "thought": "brief reasoning",
  "tool_call": { "name": "add_item_to_db", "parameters": { "name": "Eggs", "category": "dairy", "quantity": 12, "unit": "piece" } },
  "message": "Added a dozen Eggs to your list! 🥚"
}

EXAMPLES:
User: "Add 2 litres of whole milk and a dozen eggs"
Response: {"thought": "Add milk first", "tool_call": {"name": "add_item_to_db", "parameters": {"name": "Whole Milk", "category": "dairy", "quantity": 2, "unit": "litre"}}, "message": "Added 2 litres of Whole Milk! Also adding eggs now."}

User: "Remove eggs from my cart"
Response: {"thought": "User wants to remove eggs", "tool_call": {"name": "remove_item_from_db", "parameters": {"name": "Eggs"}}, "message": "Removed Eggs from your list."}

User: "Change the milk to 3 litres"
Response: {"thought": "Update milk quantity", "tool_call": {"name": "update_item_quantity", "parameters": {"name": "Whole Milk", "quantity": 3, "unit": "litre"}}, "message": "Updated Whole Milk to 3 litres."}

User: "I got the milk"
Response: {"thought": "Mark milk as complete", "tool_call": {"name": "mark_item_complete", "parameters": {"name": "Whole Milk"}}, "message": "Great! Marked Whole Milk as done ✅"}

User: "Is avocado in stock?"
Response: {"thought": "Check avocado stock", "tool_call": {"name": "check_item_stock", "parameters": {"name": "Avocado"}}, "message": "Let me check if Avocado is available..."}

User: "Clear everything from my list"
Response: {"thought": "User wants empty list", "tool_call": {"name": "clear_all_items", "parameters": {}}, "message": "Cleared your entire shopping list."}

User: "Remove the checked items"
Response: {"thought": "Clear completed items", "tool_call": {"name": "clear_completed_items", "parameters": {}}, "message": "Removed all checked-off items from your list."}

User: "Take me to checkout"
Response: {"thought": "Navigate to checkout", "tool_call": {"name": "navigate_to_checkout", "parameters": {}}, "message": "Taking you to checkout now!"}

User: "Generate my bill and download it"
Response: {"thought": "Generate PDF bill", "tool_call": {"name": "generate_bill", "parameters": {}}, "message": "Generating your invoice now! It will download automatically."}

User: "What should I buy this week?"
Response: {"thought": "Get suggestions", "tool_call": {"name": "get_suggestions", "parameters": {}}, "message": "Here are some smart suggestions for you!"}`;

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Process a user command through the LLM and return a structured response.
 * @param {Array<{role: string, content: string}>} history  Conversation history
 * @param {string} userId  User ID
 * @returns {Promise<{thought: string, toolCall?: object, message: string, suggestions: string[]}>}
 */
export async function processCommand(history, userId) {
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')?.content || '';

  // ── Deterministic router (catches clear intents before hitting the small LLM)
  const routed = intentRouter(lastUserMsg);
  if (routed) {
    console.log('[IntentRouter] Matched:', routed.toolCall?.name, '←', lastUserMsg);
    return routed;
  }

  const messages = buildMessages(history);

  let rawContent;
  try {
    rawContent =
      PROVIDER === 'openai'
        ? await completeWithOpenAI(messages)
        : await completeWithOllama(messages);
  } catch (err) {
    const providerLabel = PROVIDER === 'openai' ? 'OpenAI' : 'Ollama';
    throw new Error(`${providerLabel} unreachable: ${err.message}`);
  }

  return parseAIResponse(rawContent, history);
}

// ── Provider Implementations ──────────────────────────────────────────────────

async function completeWithOllama(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  try {
    const response = await ollamaClient.chat({
      model: OLLAMA_MODEL,
      messages,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.1,
        num_ctx: 4096,
      },
    });
    return response.message.content;
  } finally {
    clearTimeout(timeout);
  }
}

async function completeWithOpenAI(messages) {
  const response = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  return response.choices[0].message.content;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMessages(history) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const entry of history) {
    if (entry.role === 'tool') {
      messages.push({
        role: 'user',
        content: `[Tool result]: ${entry.content}`,
      });
    } else {
      messages.push({ role: entry.role, content: entry.content });
    }
  }

  return messages;
}

function parseAIResponse(raw, history = []) {
  let parsed;
  try {
    let cleaned = (raw || '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    } else {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // If fallback ONLY fires for genuine "add" intents on the last message
    const lastUserMsg2 = [...history].reverse().find((m) => m.role === 'user')?.content || '';
    // Don't fire fallback for checkout/remove/mark/etc commands
    if (!isNonAddIntent(lastUserMsg2)) {
      const fallbackAdd = extractAddIntent(lastUserMsg2);
      if (fallbackAdd) {
        return {
          thought: 'Parsed intent via fallback extractor',
          toolCall: { name: 'add_item_to_db', parameters: fallbackAdd },
          message: `Added ${fallbackAdd.quantity > 1 ? `${fallbackAdd.quantity} ` : ''}${fallbackAdd.name} to your list!`,
          suggestions: [],
        };
      }
    }

    return {
      thought: 'Could not parse structured response',
      message: raw ? raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim() : "Done!",
      suggestions: [],
    };
  }

  let toolCall = null;
  if (parsed.tool_call?.name) {
    const rawParams = parsed.tool_call.parameters || {};
    // Unwrap if params were accidentally schema-wrapped
    let cleanParams = { ...rawParams };
    if (cleanParams.properties && typeof cleanParams.properties === 'object') {
      cleanParams = { ...cleanParams.properties };
    }

    // Sanitize values
    const sanitized = {};
    for (const [k, v] of Object.entries(cleanParams)) {
      if (typeof v === 'object' && v !== null) {
        sanitized[k] = v.value || v.default || v.name || '';
      } else {
        sanitized[k] = v;
      }
    }

    // If name is missing or invalid, extract from user message
    if (!sanitized.name || typeof sanitized.name !== 'string' || sanitized.name === 'string') {
      const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')?.content || '';
      const fallback = extractAddIntent(lastUserMsg);
      if (fallback?.name) {
        sanitized.name = fallback.name;
        sanitized.category = sanitized.category || fallback.category;
        sanitized.quantity = sanitized.quantity || fallback.quantity;
        sanitized.unit = sanitized.unit || fallback.unit;
      }
    }

    toolCall = {
      name: parsed.tool_call.name,
      parameters: sanitized,
    };
  }

  return {
    thought: parsed.thought || '',
    toolCall,
    message: parsed.message || (toolCall ? `Updated your shopping list.` : "Done!"),
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

// ── Deterministic Intent Router ──────────────────────────────────────────────
// Matches high-confidence, unambiguous intents before the LLM so small models
// don't hallucinate wrong tool calls for them.

function intentRouter(text) {
  const t = text.toLowerCase().trim();

  // ── Checkout / Payment page navigation
  if (/(?:go\s+to\s+)?(?:check\s*out|proceed\s+to\s+(?:pay|checkout)|take\s+me\s+to\s+(?:pay|checkout)|i(?:'m|\s+am)\s+ready\s+to\s+pay|open\s+checkout|view\s+(?:cart|order)\s+(?:total|summary))/i.test(t)) {
    return {
      thought: 'User wants to go to checkout',
      toolCall: { name: 'navigate_to_checkout', parameters: {} },
      message: 'Taking you to checkout! 🛒',
    };
  }

  // ── Generate bill / invoice / complete payment (broad catch)
  if (/(?:generate|create|download|get|make|show)\s+(?:the\s+)?(?:my\s+)?(?:bill|invoice|receipt|pdf)|(?:finish|complete|finalize|confirm|do)\s+(?:the\s+)?(?:payment|order|purchase|transaction|shopping|checkout)|pay\s+now|i(?:'m|\s+am)\s+done\s+shopping|finish(?:ed)?\s+shopping|place\s+(?:the\s+)?order|confirm\s+(?:the\s+)?order/i.test(t)) {
    return {
      thought: 'User wants to generate their bill',
      toolCall: { name: 'generate_bill', parameters: {} },
      message: 'Generating your invoice and downloading it now! 📄',
    };
  }

  // ── Clear all items
  if (/(?:clear|empty|delete|remove|wipe)\s+(?:every(?:thing)?|all\s+(?:items?|my\s+(?:list|cart)))|start\s+(?:fresh|over|new)/i.test(t)) {
    return {
      thought: 'User wants to clear entire list',
      toolCall: { name: 'clear_all_items', parameters: {} },
      message: 'Cleared your entire shopping list.',
    };
  }

  // ── Clear completed items
  if (/(?:clear|remove|delete|clean\s+up)\s+(?:the\s+)?(?:done|checked|completed|finished)\s+items?/i.test(t)) {
    return {
      thought: 'User wants to clear completed items',
      toolCall: { name: 'clear_completed_items', parameters: {} },
      message: 'Removed all checked-off items.',
    };
  }

  // ── Get shopping list
  if (/(?:show|read|tell me|what(?:'s|\s+is)\s+(?:on|in))\s+(?:my\s+)?(?:list|cart|shopping\s+list)|(?:what\s+do\s+i\s+have)/i.test(t)) {
    return {
      thought: 'User wants to see their list',
      toolCall: { name: 'get_shopping_list', parameters: {} },
      message: 'Here is your current shopping list!',
    };
  }

  // ── Get suggestions
  if (/(?:what\s+should\s+i\s+buy|suggest|surprise\s+me|recommendations?|what(?:'s|\s+is)\s+in\s+season)/i.test(t)) {
    return {
      thought: 'User wants suggestions',
      toolCall: { name: 'get_suggestions', parameters: {} },
      message: 'Here are some smart suggestions for you!',
    };
  }

  // ── Mark item as done (I got X / I bought X / check off X)
  const gotMatch = t.match(/(?:i\s+(?:got|bought|picked\s+up|have|purchased)|check\s+off|mark\s+(?:off|as\s+done))\s+(?:the\s+)?(.+?)\s*$/i);
  if (gotMatch) {
    const itemName = gotMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (itemName && itemName.length < 50) {
      return {
        thought: 'User marked an item as purchased',
        toolCall: { name: 'mark_item_complete', parameters: { name: itemName } },
        message: `Great! Marked ${itemName} as done ✅`,
      };
    }
  }

  // ── Mark all items as done (select all / buy both/all)
  if (/(?:select\s+(?:all|both)|mark\s+all|check\s+(?:all|everything)|i\s+(?:got|bought)\s+(?:all|everything)|buy\s+(?:both|all(?:\s+of\s+them)?))/i.test(t)) {
    return {
      thought: 'User wants to mark all items done',
      toolCall: { name: 'clear_all_items', parameters: {} },
      message: 'Marked everything as purchased! Ready for checkout 🎉',
    };
  }

  // ── Remove item
  const removeMatch = t.match(/(?:remove|delete|take\s+off|don(?:'t|ot)\s+(?:need|want))\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:my\s+)?(?:list|cart))?\s*$/i);
  if (removeMatch) {
    const itemName = removeMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (itemName && itemName.length < 50 && !/^(all|every|everything)$/i.test(itemName)) {
      return {
        thought: 'User wants to remove an item',
        toolCall: { name: 'remove_item_from_db', parameters: { name: itemName } },
        message: `Removed ${itemName} from your list.`,
      };
    }
  }

  // ── Update quantity (change X to N / set X to N / update X)
  const updateMatch = t.match(/(?:change|update|set|make\s+it)\s+(?:the\s+)?(.+?)\s+to\s+(\d+)\s*([a-z]+)?/i);
  if (updateMatch) {
    const itemName = updateMatch[1].trim();
    const qty = parseInt(updateMatch[2], 10);
    const rawUnit = (updateMatch[3] || '').toLowerCase();
    const unit = normaliseUnit(rawUnit) || 'piece';
    if (itemName && qty > 0 && itemName.length < 50) {
      return {
        thought: 'User wants to update quantity',
        toolCall: { name: 'update_item_quantity', parameters: { name: itemName, quantity: qty, unit } },
        message: `Updated ${itemName} to ${qty} ${unit}.`,
      };
    }
  }

  // ── Check stock
  const stockMatch = t.match(/(?:is|do\s+you\s+have|check)\s+(?:the\s+)?(.+?)\s+(?:in\s+stock|available|stocked)/i);
  if (stockMatch) {
    const itemName = stockMatch[1].trim();
    if (itemName && itemName.length < 50) {
      return {
        thought: 'User wants to check stock',
        toolCall: { name: 'check_item_stock', parameters: { name: itemName } },
        message: `Checking stock for ${itemName}...`,
      };
    }
  }

  // ── Add item (deterministic — handles digits and number words)
  const addMatch = t.match(
    /(?:please\s+)?(?:add|buy|get|put|i\s+need|i\s+want|order)\s+(?:please\s+)?(.+?)(?:\s+(?:to|in|on)\s+(?:my\s+)?(?:list|cart|shopping\s+list))?$/i
  );
  if (addMatch) {
    const raw = addMatch[1].trim();
    // Parse "3 avocados", "two litres of milk", "one egg", "a dozen eggs", etc.
    const parsed = parseAddPhrase(raw);
    if (parsed) {
      return {
        thought: `Adding ${parsed.name}`,
        toolCall: { name: 'add_item_to_db', parameters: parsed },
        message: `Added ${parsed.quantity > 1 ? parsed.quantity + ' ' : ''}${parsed.name} to your list!`,
      };
    }
  }

  return null; // Let LLM handle
}

// Parse add phrases: "3 avocado", "two litres of milk", "one egg", "a dozen eggs"
function parseAddPhrase(raw) {
  const NUMBER_WORDS = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8,
    nine:9, ten:10, eleven:11, twelve:12, a:1, an:1, half:0.5,
    'a dozen':12, 'dozen':12, 'couple':2, 'few':3,
  };

  let qty = 1;
  let unit = 'piece';
  let name = raw;

  // Match: "3 litres of milk" or "two kg of apples"
  const fullMatch = name.match(
    /^(\d+(?:\.\d+)?|a\s+dozen|dozen|couple|few|[a-z]+)\s+(litres?|liters?|l|kg|g|grams?|bottles?|packs?|pieces?|pcs?|boxes?|bags?|cans?|loaves?|dozen|pairs?)\s+of\s+(.+)$/i
  );
  if (fullMatch) {
    const qRaw = fullMatch[1].toLowerCase().trim();
    qty = (NUMBER_WORDS[qRaw] ?? parseFloat(qRaw)) || 1;
    unit = normaliseUnit(fullMatch[2]) || 'piece';
    name = fullMatch[3].trim();
    return { name, category: inferCategory(name), quantity: qty, unit };
  }

  // Match: "two litres milk" (no "of")
  const noOfMatch = name.match(
    /^(\d+(?:\.\d+)?|a\s+dozen|dozen|couple|few|[a-z]+)\s+(litres?|liters?|l|kg|g|grams?|bottles?|packs?|pieces?|pcs?|boxes?|bags?|cans?|loaves?|dozen|pairs?)\s+(.+)$/i
  );
  if (noOfMatch) {
    const qRaw = noOfMatch[1].toLowerCase().trim();
    qty = (NUMBER_WORDS[qRaw] ?? parseFloat(qRaw)) || 1;
    unit = normaliseUnit(noOfMatch[2]) || 'piece';
    name = noOfMatch[3].trim();
    return { name, category: inferCategory(name), quantity: qty, unit };
  }

  // Match: "3 avocados" or "two eggs"
  const simpleMatch = name.match(/^(\d+|[a-z]+)\s+(.+)$/i);
  if (simpleMatch) {
    const qRaw = simpleMatch[1].toLowerCase().trim();
    const maybeQty = NUMBER_WORDS[qRaw] ?? (isNaN(Number(qRaw)) ? null : Number(qRaw));
    if (maybeQty !== null && maybeQty >= 0) {
      qty = maybeQty;
      name = simpleMatch[2].trim();
      return { name, category: inferCategory(name), quantity: qty, unit };
    }
  }

  // Plain name, no quantity
  if (name && name.length > 0 && name.length < 50 && !/^\d/.test(name)) {
    return { name, category: inferCategory(name), quantity: 1, unit: 'piece' };
  }

  return null;
}

// Returns true if the text is clearly NOT an add-item command
function isNonAddIntent(text) {
  const t = text.toLowerCase();
  return /checkout|pay|invoice|bill|receipt|remove|delete|clear|empty|mark|check\s+off|got|bought|purchased|suggest|show\s+(?:my\s+)?list|in\s+stock|available/.test(t);
}

function normaliseUnit(raw) {
  if (!raw) return null;
  const map = {
    l: 'litre', liter: 'litre', litre: 'litre', litres: 'litre', liters: 'litre',
    kg: 'kg', kgs: 'kg', kilogram: 'kg', grams: 'g', g: 'g',
    piece: 'piece', pieces: 'piece', pcs: 'piece',
    bottle: 'bottle', bottles: 'bottle',
    pack: 'pack', packs: 'pack', packet: 'pack',
    box: 'box', boxes: 'box',
    dozen: 'dozen', bag: 'bag', bags: 'bag',
    loaf: 'loaf', can: 'can', cans: 'can',
  };
  return map[raw.trim().toLowerCase()] || null;
}


function inferCategory(name) {
  const n = (name || '').toLowerCase();
  if (/milk|cheese|yogurt|butter|cream|dairy|egg/i.test(n)) return 'dairy';
  if (/apple|banana|orange|avocado|tomato|lettuce|broccoli|carrot|onion|potato|fruit|vegetable|berry|spinach|mango|grape|lemon|lime|cucumber|pepper/i.test(n)) return 'produce';
  if (/chicken|beef|pork|steak|fish|salmon|shrimp|meat|bacon|turkey|lamb|sausage/i.test(n)) return 'meat';
  if (/bread|bagel|croissant|muffin|bakery|sourdough|cake|cookie|bun|roll|pita|tortilla/i.test(n)) return 'bakery';
  if (/coffee|tea|juice|soda|water|beverage|drink|beer|wine|smoothie/i.test(n)) return 'beverages';
  if (/chip|cracker|nut|popcorn|snack|chocolate|candy|biscuit/i.test(n)) return 'snacks';
  if (/frozen|ice.cream|pizza|nugget/i.test(n)) return 'frozen';
  if (/soap|detergent|paper|clean|trash|foil|household|towel|sponge/i.test(n)) return 'household';
  if (/shampoo|toothpaste|lotion|brush|care|deodorant|razor/i.test(n)) return 'personal_care';
  return 'other';
}
