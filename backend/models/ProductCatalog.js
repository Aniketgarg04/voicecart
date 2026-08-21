import mongoose from 'mongoose';

const productCatalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'Generic',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    isSeasonal: {
      type: Boolean,
      default: false,
    },
    // Months (1-12) when this item is in season
    seasonMonths: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((m) => m >= 1 && m <= 12),
        message: 'Season months must be between 1 and 12',
      },
    },
    substitutes: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    unit: {
      type: String,
      default: 'piece',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Text search index
productCatalogSchema.index({ name: 'text', brand: 'text', tags: 'text' });
productCatalogSchema.index({ category: 1, price: 1 });

const ProductCatalog = mongoose.model('ProductCatalog', productCatalogSchema);

export default ProductCatalog;
