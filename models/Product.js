import mongoose from "mongoose";

/**
 * Product Schema
 * Represents a product listing in the store.
 * inStock flag controls whether the item can be added to cart or ordered.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  },
);

// Index for filtering products by category (used on product listing page)
productSchema.index({ category: 1 });

// Index for sorting/filtering products by price
productSchema.index({ price: 1 });

// Index for filtering in-stock products (common query when adding to cart)
productSchema.index({ inStock: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
