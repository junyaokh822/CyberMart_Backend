import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order from cart
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Check if all products are still in stock and get current prices
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          error: `Product ${item.name} not found`,
        });
      }

      if (!product.inStock) {
        return res.status(400).json({
          error: `Product ${product.name} is out of stock`,
        });
      }

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price, // Use current price
        name: product.name,
        imageUrl: product.imageUrl,
      });
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress,
      status: "pending",
    });

    // Clear user's cart after successful order
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get user's order history
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    }); // newest first

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order (only if pending)
// @access  Private
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        error: "Only pending orders can be cancelled",
      });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Admin only: Get all orders (for admin dashboard)
// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin only)
// @access  Private/Admin
import { admin } from "../middleware/auth.js";

router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Admin only: Update order status
router.put("/admin/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Update order status error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
