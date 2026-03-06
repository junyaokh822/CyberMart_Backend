import mongoose from "mongoose";

/**
 * WishlistItem Sub-Schema
 * Represents a saved product in the user's wishlist.
 * Stores a snapshot of product details (name, price, etc.) so the wishlist
 * renders quickly without needing to populate/join the Product collection.
 */
const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  price: Number,
  imageUrl: String,
  category: String,
  addedAt: {
    type: Date,
    default: Date.now, // tracks when the item was saved
  },
});

/**
 * Wishlist Schema
 * Each user has a single wishlist document (enforced by unique: true on userId).
 * Items are stored as a subdocument array for efficient add/remove operations.
 */
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one wishlist per user
    },
    items: [wishlistItemSchema],
  },
  {
    timestamps: true,
  },
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
