import mongoose from 'mongoose';
import foodModel from '../../backend/models/foodModel.js';

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/food-del');
    console.log("Connected successfully");
    const foods = await foodModel.find({ quantity: { $exists: true } });
    console.log("Foods with quantity:");
    foods.forEach(f => {
      console.log(`- Name: ${f.name}, Category: ${f.category}, Quantity: ${f.quantity}, Price: ${f.price}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
