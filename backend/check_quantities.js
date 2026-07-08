import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/food-del');
    console.log("Connected successfully");
    const result = await foodModel.updateOne(
      { name: "Lamb Ribs" },
      { $set: { expiryDate: new Date("2026-07-20") } }
    );
    console.log("Update result:", result);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
