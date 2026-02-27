import express from "express";
import Product from "../models/Product.js";
import axios from "axios";

const router = express.Router();

// Get all products
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Get single product by ID
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create new product
router.post("/", async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// Update product
router.put("/:id", async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete("/:id", async (req, res, next) => {
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

// Seed products from Fake Store API
router.post("/seed", async (req, res, next) => {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      return res.json({
        message: "Products already exist in database",
        count: existingProducts,
      });
    }

    // Fetch from Fake Store API
    const response = await axios.get("https://fakestoreapi.com/products");
    const products = response.data;

    // Transform to match schema
    const formattedProducts = products.map((product) => ({
      name: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.image,
      inStock: true,
    }));

    // Insert into database
    const inserted = await Product.insertMany(formattedProducts);

    res.json({
      message: "Products seeded successfully!",
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
