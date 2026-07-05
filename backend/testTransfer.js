import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import foodModel from "./models/foodModel.js";
import transferModel from "./models/transferModel.js";

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    const foodItems = await foodModel.find({});
    console.log("Found food items count:", foodItems.length);
    if (foodItems.length > 0) {
      console.log("First item:", {
        _id: foodItems[0]._id,
        name: foodItems[0].name,
        category: foodItems[0].category,
        quantity: foodItems[0].quantity,
        unit: foodItems[0].unit,
      });
    }

    // Find "Cooked Crab"
    const cookedCrab = await foodModel.findOne({ name: /Cooked Crab/i });
    if (!cookedCrab) {
      console.log("Cooked Crab not found in DB.");
      mongoose.disconnect();
      return;
    }

    console.log("Found Cooked Crab:", cookedCrab);

    const qtyToMove = 25;
    const recipientSection = "Rolls Station";

    console.log("Attempting transfer of 25 units...");
    const currentStock = Number(cookedCrab.quantity) || 0;
    if (currentStock < qtyToMove) {
      console.log("Insufficient stock test: stock =", currentStock, "move =", qtyToMove);
    }

    // Try update
    await foodModel.findByIdAndUpdate(cookedCrab._id, { quantity: currentStock - qtyToMove });
    console.log("Updated food stock successfully.");

    // Try save transfer
    const transfer = new transferModel({
      materialId: cookedCrab._id,
      materialName: cookedCrab.name,
      quantity: qtyToMove,
      unit: cookedCrab.unit || 'units',
      recipientSection
    });
    await transfer.save();
    console.log("Saved transfer log successfully.");

  } catch (error) {
    console.error("CRASH ERROR:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
