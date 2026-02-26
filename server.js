import express from "express";
import { logReq, globalErr } from "./middleware/basicMiddlewares.js";
import dotenv from "dotenv";
import connectDB from "./db/conn.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import axios from "axios";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
connectDB();

//express setup
app.use(express.json());
app.use(logReq);

//routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Temporary test route for models
app.get("/api/test-models", async (req, res) => {
  try {
    const models = {
      user: await User.findOne().select("-password"),
      product: await Product.findOne(),
    };
    res.json({
      message: "Models are working!",
      modelsDefined: {
        user: !!models.user,
        product: !!models.product,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed products from Fake Store API
app.post("/api/seed-products", async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//global handling errors
app.use(globalErr);

//listener
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
