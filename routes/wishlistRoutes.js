import express from "express";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get the logged-in user's wishlist (auto-creates if missing)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    // Populate product details so the wishlist page has fresh data
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate(
      "items.productId",
      "name price imageUrl inStock category",
    );

    // Auto-create an empty wishlist if one doesn't exist yet
    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        items: [],
      });
    }

    res.json(wishlist);
  } catch (error) {
    console.error("Get wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if a specific product is already in the user's wishlist
// @access  Private
router.get("/check/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    // If no wishlist exists yet, product can't be in it
    if (!wishlist) {
      return res.json({ inWishlist: false });
    }

    // Check if any item matches the given productId
    const inWishlist = wishlist.items.some(
      (item) => item.productId?.toString() === productId,
    );

    res.json({ inWishlist });
  } catch (error) {
    console.error("Check wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/wishlist
// @desc    Add a product to the wishlist
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { productId } = req.body;

    // Confirm the product exists before saving to wishlist
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get or initialize the user's wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user._id,
        items: [],
      });
    }

    // Prevent duplicate wishlist entries
    const existingItem = wishlist.items.find(
      (item) => item.productId?.toString() === productId,
    );
    if (existingItem) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    // Store a snapshot of product details for quick wishlist rendering
    wishlist.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });

    await wishlist.save();

    // Populate so response includes fresh product data
    await wishlist.populate("items.productId", "name price imageUrl inStock");

    res.status(201).json(wishlist);
  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove an item from the wishlist by productId or subdocument _id
// @access  Private
router.delete("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    const before = wishlist.items.length;

    // Filter out the item matching either the productId or the subdocument _id
    // This handles both cases: removing by product reference or by wishlist item _id
    wishlist.items = wishlist.items.filter(
      (item) =>
        item.productId?.toString() !== productId &&
        item._id?.toString() !== productId,
    );

    // If length didn't change, the item wasn't found
    if (wishlist.items.length === before) {
      return res.status(404).json({ error: "Item not found in wishlist" });
    }

    await wishlist.save();
    res.json({ message: "Item removed from wishlist", wishlist });
  } catch (error) {
    console.error("Remove from wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
