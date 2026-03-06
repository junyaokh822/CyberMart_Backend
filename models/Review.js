import mongoose from "mongoose";

/**
 * Review Schema
 * Represents a product review left by a verified purchaser.
 * Users can only review products they have purchased and delivered/shipped.
 * One review per user per product is enforced by a unique compound index.
 */
const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    // Stored directly to avoid extra User lookup when displaying reviews
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Unique compound index: one review per user per product
// Also speeds up lookups when checking if a user has already reviewed a product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index for fetching all reviews for a product (product detail page)
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
