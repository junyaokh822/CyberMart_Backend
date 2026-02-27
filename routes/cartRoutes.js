import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/cart/create
// @desc    create a cart for users who registered
// @access  Private
router.post("/create", protect, async (req, res) => {
  try {
    const existing = await Cart.findOne({ userId: req.user._id });
    if (existing) {
      return res.json({ message: "Cart already exists", existing });
    }
    const cart = await Cart.create({
      userId: req.user._id,
      items: [],
      totalPrice: 0,
    });
    res.status(201).json(cart);
  } catch (error) {
    console.error("Create cart error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/cart
// @desc    Get the logged-in user's cart
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    res.json(cart);
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/cart/items
// @desc    Add an item to the cart (or increase quantity if already in cart)
// @access  Private
router.post("/items", protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (!product.inStock) {
      return res.status(400).json({ error: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        quantity,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl,
      });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    console.error("Add item error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/cart/items/:itemId
// @desc    Update the quantity of a specific cart item
// @access  Private
router.put("/items/:itemId", protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Update item error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove a specific item from the cart
// @access  Private
router.delete("/items/:itemId", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    item.deleteOne();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Delete item error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/cart
// @desc    Clear all items from the cart
// @access  Private
router.delete("/", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
