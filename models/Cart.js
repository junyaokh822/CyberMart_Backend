import mongoose from "mongoose";

/**
 * CartItem Sub-Schema
 * Represents a single product entry inside a user's cart.
 * Stores a snapshot of the product's price and name at the time of adding,
 * so the cart reflects what the user saw when they added it.
 */
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity cannot be less than 1"],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  name: String,
  imageUrl: String,
});

/**
 * Cart Schema
 * Each user has exactly one cart (enforced by unique: true on userId).
 * totalPrice is automatically recalculated before every save via pre-save hook.
 */
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * pre-save hook
 * Automatically recalculates totalPrice before saving the cart.
 * This keeps the total in sync whenever items are added, removed, or updated.
 */
cartSchema.pre("save", function () {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
