import express from 'express';
import mongoose from 'mongoose';
import { ShoppingItem } from '../models/ShoppingItem.js';
import ProductCatalog from '../models/ProductCatalog.js';
import { executeTool } from '../tools/toolExecutor.js';

const router = express.Router();

// ── Health ────────────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'ollama',
    transcriptionProvider: process.env.TRANSCRIPTION_PROVIDER || 'local',
  });
});

// ── Shopping Items ────────────────────────────────────────────────────────────

router.get('/items', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'anonymous';
    const showCompleted = req.query.completed === 'true';

    const items = await ShoppingItem.find({ userId, isCompleted: showCompleted })
      .sort({ category: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }
    const item = await ShoppingItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, deleted: item });
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }
    const allowed = ['name', 'category', 'quantity', 'unit', 'isCompleted', 'notes'];
    const update = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const item = await ShoppingItem.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

router.delete('/items', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'anonymous';
    const completed = req.query.completed === 'true';
    await ShoppingItem.deleteMany({ userId, isCompleted: completed });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Product Catalog ───────────────────────────────────────────────────────────

router.get('/catalog', async (req, res, next) => {
  try {
    const { category, seasonal } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (seasonal === 'true') filter.isSeasonal = true;

    const products = await ProductCatalog.find(filter).sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] || 'anonymous';
    const { name, category = 'other', quantity = 1, unit = 'piece', notes = '' } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Item name is required' });

    const result = await executeTool('add_item_to_db', { name, category, quantity, unit, notes }, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/catalog/search', async (req, res, next) => {
  try {
    const { q, maxPrice, brand, category } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Missing query param ?q=' });

    const result = await executeTool(
      'search_catalog',
      {
        query: q,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        brand,
        category,
      },
      null
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Suggestions ───────────────────────────────────────────────────────────────

router.get('/suggestions', async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'anonymous';
    const result = await executeTool('get_suggestions', {}, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
