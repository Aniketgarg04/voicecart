/**
 * Catalog Seeder
 * Run: node scripts/seedCatalog.js
 *
 * Seeds 40 realistic products across all categories with seasonal flags,
 * substitutes, and tags for text search.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import ProductCatalog from '../models/ProductCatalog.js';

const PRODUCTS = [
  // ── Dairy ─────────────────────────────────────────────────────────────────
  { name: 'Whole Milk', brand: 'Amul', price: 2.49, category: 'dairy', unit: 'litre', substitutes: ['Oat Milk', 'Almond Milk', 'Soy Milk'], tags: ['milk', 'dairy', 'calcium'], isSeasonal: false },
  { name: 'Almond Milk', brand: 'Silk', price: 3.99, category: 'dairy', unit: 'litre', substitutes: ['Oat Milk', 'Whole Milk'], tags: ['vegan', 'dairy-free', 'milk', 'nut'], isSeasonal: false },
  { name: 'Greek Yogurt', brand: 'Chobani', price: 1.89, category: 'dairy', unit: '200g', substitutes: ['Regular Yogurt'], tags: ['yogurt', 'protein', 'probiotic'], isSeasonal: false },
  { name: 'Cheddar Cheese', brand: 'Kraft', price: 4.79, category: 'dairy', unit: '200g', substitutes: ['Mozzarella', 'Gouda'], tags: ['cheese', 'cheddar', 'dairy'], isSeasonal: false },
  { name: 'Butter', brand: 'Amul', price: 3.29, category: 'dairy', unit: '500g', substitutes: ['Margarine', 'Ghee'], tags: ['butter', 'dairy', 'baking'], isSeasonal: false },

  // ── Produce ───────────────────────────────────────────────────────────────
  { name: 'Organic Apples', brand: 'Generic', price: 3.49, category: 'produce', unit: 'kg', substitutes: ['Pears', 'Regular Apples'], tags: ['fruit', 'apple', 'organic'], isSeasonal: true, seasonMonths: [9, 10, 11] },
  { name: 'Bananas', brand: 'Dole', price: 1.29, category: 'produce', unit: 'bunch', substitutes: ['Plantain'], tags: ['fruit', 'banana', 'potassium'], isSeasonal: false },
  { name: 'Baby Spinach', brand: 'Earthbound Farm', price: 3.99, category: 'produce', unit: '150g', substitutes: ['Kale', 'Arugula'], tags: ['greens', 'spinach', 'iron', 'salad'], isSeasonal: false },
  { name: 'Tomatoes', brand: 'Generic', price: 2.49, category: 'produce', unit: 'kg', substitutes: ['Canned Tomatoes', 'Cherry Tomatoes'], tags: ['tomato', 'vegetable', 'salad'], isSeasonal: true, seasonMonths: [6, 7, 8] },
  { name: 'Avocado', brand: 'Generic', price: 1.49, category: 'produce', unit: 'piece', substitutes: ['Hummus'], tags: ['fruit', 'avocado', 'healthy fat', 'vegan'], isSeasonal: false },
  { name: 'Broccoli', brand: 'Generic', price: 1.89, category: 'produce', unit: 'head', substitutes: ['Cauliflower', 'Brussels Sprouts'], tags: ['vegetable', 'broccoli', 'vitamin c'], isSeasonal: true, seasonMonths: [10, 11, 12, 1, 2] },
  { name: 'Strawberries', brand: 'Driscoll\'s', price: 3.99, category: 'produce', unit: '250g', substitutes: ['Raspberries', 'Blueberries'], tags: ['berry', 'fruit', 'antioxidant'], isSeasonal: true, seasonMonths: [4, 5, 6] },
  { name: 'Garlic', brand: 'Generic', price: 0.99, category: 'produce', unit: 'bulb', substitutes: ['Garlic Powder'], tags: ['garlic', 'spice', 'aromatic'], isSeasonal: false },

  // ── Meat & Seafood ────────────────────────────────────────────────────────
  { name: 'Chicken Breast', brand: 'Perdue', price: 6.99, category: 'meat', unit: 'kg', substitutes: ['Tofu', 'Turkey Breast'], tags: ['chicken', 'protein', 'poultry', 'lean'], isSeasonal: false },
  { name: 'Salmon Fillet', brand: 'Generic', price: 12.99, category: 'meat', unit: 'kg', substitutes: ['Tilapia', 'Tuna'], tags: ['fish', 'salmon', 'omega-3', 'seafood'], isSeasonal: false },
  { name: 'Ground Beef', brand: 'Generic', price: 7.49, category: 'meat', unit: 'kg', substitutes: ['Ground Turkey', 'Ground Pork'], tags: ['beef', 'ground', 'protein'], isSeasonal: false },

  // ── Bakery ────────────────────────────────────────────────────────────────
  { name: 'Sourdough Bread', brand: 'Dave\'s Killer Bread', price: 4.99, category: 'bakery', unit: 'loaf', substitutes: ['Whole Wheat Bread', 'Rye Bread'], tags: ['bread', 'sourdough', 'fermented'], isSeasonal: false },
  { name: 'Whole Wheat Tortillas', brand: 'Mission', price: 3.49, category: 'bakery', unit: 'pack', substitutes: ['Flour Tortillas', 'Lettuce Wraps'], tags: ['tortilla', 'wrap', 'wheat'], isSeasonal: false },
  { name: 'Croissant', brand: 'Generic', price: 2.99, category: 'bakery', unit: 'pack of 4', substitutes: ['Bread Roll', 'Pita Bread'], tags: ['pastry', 'croissant', 'breakfast', 'french'], isSeasonal: false },

  // ── Beverages ─────────────────────────────────────────────────────────────
  { name: 'Orange Juice', brand: 'Tropicana', price: 4.29, category: 'beverages', unit: 'litre', substitutes: ['Apple Juice', 'Fresh Oranges'], tags: ['juice', 'orange', 'vitamin c'], isSeasonal: false },
  { name: 'Sparkling Water', brand: 'LaCroix', price: 5.99, category: 'beverages', unit: 'pack of 12', substitutes: ['Still Water', 'Club Soda'], tags: ['water', 'sparkling', 'zero calorie'], isSeasonal: false },
  { name: 'Green Tea', brand: 'Bigelow', price: 3.99, category: 'beverages', unit: 'box of 40', substitutes: ['Black Tea', 'Chamomile Tea'], tags: ['tea', 'antioxidant', 'caffeine'], isSeasonal: false },
  { name: 'Cold Brew Coffee', brand: 'Chameleon', price: 6.49, category: 'beverages', unit: '240ml', substitutes: ['Iced Coffee', 'Espresso'], tags: ['coffee', 'cold brew', 'caffeine'], isSeasonal: true, seasonMonths: [4, 5, 6, 7, 8, 9] },

  // ── Snacks ────────────────────────────────────────────────────────────────
  { name: 'Mixed Nuts', brand: 'Planters', price: 8.99, category: 'snacks', unit: '500g', substitutes: ['Trail Mix', 'Peanuts'], tags: ['nuts', 'protein', 'healthy snack'], isSeasonal: false },
  { name: 'Dark Chocolate', brand: 'Lindt', price: 3.49, category: 'snacks', unit: '100g', substitutes: ['Milk Chocolate', 'Cocoa Nibs'], tags: ['chocolate', 'dark', 'antioxidant', 'sweet'], isSeasonal: false },
  { name: 'Rice Cakes', brand: 'Quaker', price: 2.99, category: 'snacks', unit: 'pack', substitutes: ['Crackers', 'Corn Cakes'], tags: ['rice cake', 'low calorie', 'light snack'], isSeasonal: false },
  { name: 'Hummus', brand: 'Sabra', price: 3.79, category: 'snacks', unit: '230g', substitutes: ['Guacamole', 'Tzatziki'], tags: ['dip', 'hummus', 'chickpea', 'vegan', 'protein'], isSeasonal: false },

  // ── Frozen ────────────────────────────────────────────────────────────────
  { name: 'Frozen Peas', brand: 'Birds Eye', price: 2.49, category: 'frozen', unit: '500g', substitutes: ['Fresh Peas', 'Edamame'], tags: ['vegetable', 'peas', 'frozen', 'green'], isSeasonal: false },
  { name: 'Frozen Berry Mix', brand: 'Wyman\'s', price: 5.99, category: 'frozen', unit: '500g', substitutes: ['Fresh Berries'], tags: ['berries', 'frozen', 'smoothie', 'antioxidant'], isSeasonal: false },
  { name: 'Veggie Burger Patties', brand: 'Beyond Meat', price: 7.99, category: 'frozen', unit: 'pack of 2', substitutes: ['Black Bean Burger', 'Beef Burger'], tags: ['vegan', 'plant-based', 'burger', 'protein'], isSeasonal: false },

  // ── Household ─────────────────────────────────────────────────────────────
  { name: 'Dish Soap', brand: 'Dawn', price: 2.99, category: 'household', unit: 'bottle', substitutes: ['Seventh Generation'], tags: ['cleaning', 'dish', 'soap'], isSeasonal: false },
  { name: 'Paper Towels', brand: 'Bounty', price: 6.49, category: 'household', unit: 'pack of 6', substitutes: ['Cloth Towels', 'Reusable Wipes'], tags: ['paper', 'towel', 'cleaning'], isSeasonal: false },
  { name: 'Laundry Detergent', brand: 'Tide', price: 11.99, category: 'household', unit: '1.5kg', substitutes: ['Arm & Hammer', 'Method'], tags: ['laundry', 'cleaning', 'detergent'], isSeasonal: false },
  { name: 'Trash Bags', brand: 'Glad', price: 7.99, category: 'household', unit: 'pack of 30', substitutes: ['BioBag', 'Generic'], tags: ['trash', 'garbage', 'bags'], isSeasonal: false },

  // ── Personal Care ─────────────────────────────────────────────────────────
  { name: 'Toothpaste', brand: 'Colgate', price: 3.49, category: 'personal_care', unit: '150ml', substitutes: ['Sensodyne', 'Tom\'s of Maine'], tags: ['dental', 'oral care', 'teeth'], isSeasonal: false },
  { name: 'Shampoo', brand: 'Pantene', price: 5.99, category: 'personal_care', unit: '400ml', substitutes: ['Head & Shoulders', 'Dove'], tags: ['hair', 'shampoo', 'care'], isSeasonal: false },
  { name: 'Sunscreen SPF 50', brand: 'Neutrogena', price: 9.99, category: 'personal_care', unit: '150ml', substitutes: ['Banana Boat', 'Coppertone'], tags: ['sunscreen', 'spf', 'skin', 'summer'], isSeasonal: true, seasonMonths: [3, 4, 5, 6, 7, 8] },

  // ── Other ─────────────────────────────────────────────────────────────────
  { name: 'Extra Virgin Olive Oil', brand: 'California Olive Ranch', price: 8.49, category: 'other', unit: '500ml', substitutes: ['Avocado Oil', 'Canola Oil'], tags: ['oil', 'cooking', 'mediterranean', 'healthy fat'], isSeasonal: false },
  { name: 'Quinoa', brand: 'Ancient Harvest', price: 6.99, category: 'other', unit: '500g', substitutes: ['Brown Rice', 'Couscous'], tags: ['grain', 'protein', 'gluten-free'], isSeasonal: false },
  { name: 'Eggs', brand: 'Generic', price: 3.99, category: 'dairy', unit: 'dozen', substitutes: ['Flax Eggs', 'Egg Substitute'], tags: ['eggs', 'protein', 'breakfast', 'baking'], isSeasonal: false },
  { name: 'Pasta', brand: 'Barilla', price: 2.29, category: 'other', unit: '500g', substitutes: ['Zucchini Noodles', 'Rice Noodles', 'Chickpea Pasta'], tags: ['pasta', 'carbs', 'italian', 'dinner'], isSeasonal: false },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    await ProductCatalog.deleteMany({});
    console.log('🗑️   Cleared existing catalog');

    const result = await ProductCatalog.insertMany(PRODUCTS);
    console.log(`✅  Seeded ${result.length} products`);

    await mongoose.disconnect();
    console.log('👋  Done');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
