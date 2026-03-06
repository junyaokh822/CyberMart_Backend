import express from "express";
import { logReq, globalErr } from "./middleware/basicMiddlewares.js";
import dotenv from "dotenv";
import connectDB from "./db/conn.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

/**
 * CORS Configuration
 * Allows requests from the frontend origin (set via FRONTEND_URL env var).
 * Supports credentials (cookies/auth headers) and common HTTP methods.
 * Falls back to localhost:5173 for local development.
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse incoming JSON request bodies
app.use(express.json());

// Log every incoming request (method, URL, date)
app.use(logReq);

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// Global error handler — must be registered AFTER all routes
app.use(globalErr);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
