import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product + average rating
// @access  Public
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Fetch latest 50 reviews, newest first
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate average rating on the server to keep frontend simple
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
// @desc    Check if the logged-in user is eligible to review this product
// @access  Private
router.get("/check-purchase/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // User must have a delivered or shipped order containing this product
    const hasPurchased = await Order.findOne({
      userId: req.user._id,
      "items.productId": productId,
      status: { $in: ["delivered", "shipped"] },
    });

    // User can only review once per product
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
// @desc    Submit a new review for a purchased product
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Confirm the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Only verified buyers can leave reviews
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

    // Prevent duplicate reviews (also enforced by unique index in Review model)
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        error: "You have already reviewed this product",
      });
    }

    // Store user's full name directly so it shows correctly even if they rename later
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
// @desc    Edit your own review
// @access  Private
router.put("/:reviewId", protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only the original author can edit their review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Only update fields that were provided in the request
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
// @desc    Delete a review (owner or admin)
// @access  Private
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Allow deletion by the review author OR an admin (for moderation)
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
