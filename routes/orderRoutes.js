import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order from the user's current cart, then clear the cart
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;

    // Fetch user's cart and ensure it has items
    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Validate every cart item against the current Product collection
    // and lock in the current price at time of order
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId)
        .select("name price imageUrl inStock")
        .lean();

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.name} not found` });
      }
      if (!product.inStock) {
        return res
          .status(400)
          .json({ error: `Product ${product.name} is out of stock` });
      }

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price, // use live price, not cached cart price
        name: product.name,
        imageUrl: product.imageUrl,
      });
    }

    // Calculate total from validated order items
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create the order document
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      shippingAddress,
      status: "pending",
    });

    // Clear the cart after a successful order placement
    // Note: cannot use lean() here since it needs to mutate and save
    const cartDoc = await Cart.findOne({ userId: req.user._id });
    cartDoc.items = [];
    cartDoc.totalPrice = 0;
    await cartDoc.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get the logged-in user's full order history (newest first)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    // .lean() for fast read-only response
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get a single order by ID (must belong to the logged-in user)
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    // Scope query to current user to prevent accessing other users' orders
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

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
// @desc    Cancel an order — only allowed while status is "pending"
// @access  Private
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    // No lean() here — need to mutate and save the document
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Prevent cancellation once the order has started processing
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

// @route   GET /api/orders/admin/all
// @desc    Get all orders across all users (admin dashboard)
// @access  Private/Admin
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/orders/admin/:id/status
// @desc    Update any order's status (admin only)
// @access  Private/Admin
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

    // No lean() — need to mutate and save
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
