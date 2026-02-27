import express from "express";
import { logReq, globalErr } from "./middleware/basicMiddlewares.js";
import dotenv from "dotenv";
import connectDB from "./db/conn.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

//express setup
app.use(express.json());
app.use(logReq);

//routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

//global handling errors
app.use(globalErr);

//listener
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
