import express from "express";
import Product from "../models/Product.js";
import axios from "axios";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    // .select() omits description (only needed on detail page) to reduce payload
    // .lean() returns plain JS objects instead of Mongoose documents — faster for read-only responses
    const products = await Product.find()
      .select("name price imageUrl category inStock")
      .lean();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get a single product by ID (full document including description)
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    // Full document needed here for the product detail page
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/seed
// @desc    Seed the database with products from Fake Store API (runs once)
// @access  Public
router.post("/seed", async (req, res, next) => {
  try {
    // Only seed if the collection is empty — prevents duplicate data
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      return res.json({
        message: "Products already exist in database",
        count: existingProducts,
      });
    }

    // Fetch from Fake Store API and map to our schema shape
    const response = await axios.get("https://fakestoreapi.com/products");
    const products = response.data;

    const formattedProducts = products.map((product) => ({
      name: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.image,
      inStock: true,
    }));

    // Bulk insert is more efficient than inserting one by one
    const inserted = await Product.insertMany(formattedProducts);
    res.json({
      message: "Products seeded successfully!",
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post("/", protect, admin, async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update an existing product
// @access  Private/Admin
router.put("/:id", protect, admin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return updated document
      runValidators: true, // enforce schema validation on update
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
