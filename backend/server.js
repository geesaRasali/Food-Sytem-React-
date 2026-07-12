import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRouter.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import chatRouter from "./routes/chatRoute.js";
import contactRouter from "./routes/contactRoute.js";
import supplierRouter from "./routes/supplierRoute.js";
import { ensureInitialAdminUser } from "./utils/ensureAdminUser.js";
import { registerOrderClient } from "./utils/orderRealtime.js";
import authMiddleware from "./middleware/auth.js";

//app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());

//API endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("images"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/chat", chatRouter);
app.use("/api/contact", contactRouter);
app.use("/api/supplier", supplierRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.get("/api/order/stream", authMiddleware, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  registerOrderClient(res);
});

const startServer = async () => {
  try {
    await connectDB();
    await ensureInitialAdminUser();

    app.listen(port, () => {
      console.log(`Server Start on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
