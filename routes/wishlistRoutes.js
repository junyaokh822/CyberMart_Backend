import express from "express";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate(
      "items.productId",
      "name price imageUrl inStock category",
    );

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
// @desc    Check if product is in wishlist
// @access  Private
router.get("/check/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.json({ inWishlist: false });
    }

    const inWishlist = wishlist.items.some(
      (item) => item.productId.toString() === productId,
    );

    res.json({ inWishlist });
  } catch (error) {
    console.error("Check wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user._id,
        items: [],
      });
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    // Add new item
    wishlist.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });

    await wishlist.save();

    await wishlist.populate("items.productId", "name price imageUrl inStock");

    res.status(201).json(wishlist);
  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }

    // Filter out the item
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    await wishlist.save();

    res.json({ message: "Item removed from wishlist", wishlist });
  } catch (error) {
    console.error("Remove from wishlist error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
