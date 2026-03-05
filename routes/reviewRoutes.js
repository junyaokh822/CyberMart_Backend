import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Get reviews error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/reviews/check-purchase/:productId
// @desc    Check if user can review a product
// @access  Private
router.get("/check-purchase/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      userId: req.user._id,
      "items.productId": productId,
      status: { $in: ["delivered", "shipped"] },
    });

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });

    res.json({
      canReview: !!hasPurchased && !existingReview,
      hasPurchased: !!hasPurchased,
      hasReviewed: !!existingReview,
    });
  } catch (error) {
    console.error("Check purchase error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      userId: req.user._id,
      "items.productId": productId,
      status: { $in: ["delivered", "shipped"] },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        error: "You can only review products you have purchased",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        error: "You have already reviewed this product",
      });
    }

    // Create review
    const review = await Review.create({
      productId,
      userId: req.user._id,
      rating,
      comment,
      userName: `${req.user.firstName} ${req.user.lastName}`,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Create review error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put("/:reviewId", protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    res.json(review);
  } catch (error) {
    console.error("Update review error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review or is admin
    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
