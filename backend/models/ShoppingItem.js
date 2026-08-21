import mongoose from 'mongoose';

const CATEGORIES = [
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
];

const shoppingItemSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    unit: {
      type: String,
      default: 'piece',
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for fast per-user queries
shoppingItemSchema.index({ userId: 1, isCompleted: 1, category: 1 });

// Case-insensitive name search for the same user
shoppingItemSchema.index(
  { userId: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
  }
);

const ShoppingItem = mongoose.model('ShoppingItem', shoppingItemSchema);

export { ShoppingItem, CATEGORIES };
