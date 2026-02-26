import express from "express";
import { logReq, globalErr } from "./middleware/basicMiddlewares.js";
import dotenv from "dotenv";
import connectDB from "./db/conn.js";
import User from "./models/User.js";
import Product from "./models/Product.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
connectDB();

//express setup
app.use(express.json());
app.use(logReq);

//routes
app.get("/", (req, res) => {
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

//global handling errors
app.use(globalErr);

//listener
app.listen(PORT, () => {
  console.log(`Server is running on: http://localhost:${PORT}`);
});
