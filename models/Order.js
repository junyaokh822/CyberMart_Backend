import mongoose from "mongoose";

/**
 * OrderItem Sub-Schema
 * Represents a product snapshot at the time the order was placed.
 * Stores price independently from the Product model so order history
 * remains accurate even if product prices change later.
 */
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true, // price locked at time of order
  },
  name: String,
  imageUrl: String,
});

/**
 * Order Schema
 * Represents a completed checkout by a user.
 * Status tracks the order lifecycle from pending → delivered (or cancelled).
 * shippingAddress is embedded directly for a point-in-time snapshot.
 * paymentDetails stores transaction information without sensitive data.
 */
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "cash_on_delivery"],
      required: true,
    },
    /**
     * Payment transaction details
     * Stores only non-sensitive information for order reference
     * Full payment processing should be handled by a payment gateway
     */
    paymentDetails: {
      transactionId: String, // Reference from payment processor (Stripe, PayPal, etc.)
      cardLastFour: String, // Last 4 digits only (for card reference)
      payerEmail: String, // For PayPal or digital wallets
      paidAt: {
        type: Date,
        default: Date.now,
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fetching all orders belonging to a specific user
orderSchema.index({ userId: 1 });

// Index for filtering orders by status (e.g. admin dashboard, review eligibility checks)
orderSchema.index({ status: 1 });

// Index for filtering orders by payment status
orderSchema.index({ "paymentDetails.paymentStatus": 1 });

// Compound index for review eligibility query: user's delivered/shipped orders for a product
orderSchema.index({ userId: 1, "items.productId": 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
