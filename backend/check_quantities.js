import mongoose from 'mongoose';
import orderModel from './models/orderModel.js';

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/food-del');
    console.log("Connected successfully");
    const orders = await orderModel.find({});
    orders.forEach(o => {
      console.log(`- ID: ${o._id}, Amount: ${o.amount}, Date: ${o.date}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
