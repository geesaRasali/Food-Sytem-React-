import foodModel from "../models/foodModel.js";
import supplyModel from "../models/supplyModel.js";
import fs from "fs";
import path from "path";

const foodCategories = [
  { name: "Salad", image: "salad.png" },
  { name: "Rolls", image: "rolls.png" },
  { name: "Deserts", image: "deserts.png" },
  { name: "Sandwich", image: "sandwich.png" },
  { name: "Cake", image: "cake.png" },
  { name: "Pure Veg", image: "pure_veg.png" },
  { name: "Pasta", image: "pasta.png" },
  { name: "Noodles", image: "noodles.png" },
];


const foodData = [
  {
    _id: "1",
    name: "Greek Salad",
    image: "food_1.png",
    price: 12,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "2",
    name: "Veg Salad",
    image: "food_2.png",
    price: 18,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "3",
    name: "Clover Salad",
    image: "food_3.png",
    price: 16,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "4",
    name: "Chicken Salad",
    image: "food_4.png",
    price: 24,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Salad",
  },
  {
    _id: "5",
    name: "Lasagna Rolls",
    image: "food_5.png",
    price: 14,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "6",
    name: "Peri Peri Rolls",
    image: "food_6.png",
    price: 12,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "7",
    name: "Chicken Rolls",
    image: "food_7.png",
    price: 20,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
    _id: "8",
    name: "Veg Rolls",
    image: "food_8.png",
    price: 15,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Rolls",
  },
  {
     _id: "8",
    name: "Ripple Ice Cream",
    image: "food_9.png",
    price: 14,
    description:
      "Food provides essential nutrients for overall health and well-being",
    category: "Deserts",
  }
];

// add food item

const addFood = async (req, res) => {
  console.log("Request body:", req.body); // Debug log
  console.log("Request file:", req.file); // Debug log

  // Check if file is uploaded or default image is provided
  let image_filename = "";
  if (req.file) {
    image_filename = `${req.file.filename}`;
  } else if (req.body.image) {
    image_filename = req.body.image;
  } else {
    return res.json({ success: false, message: "Image is required" });
  }

  // Check if all required fields are present
  if (
    !req.body.name ||
    !req.body.description ||
    !req.body.price ||
    !req.body.category
  ) {
    return res.json({ success: false, message: "All fields are required" });
  }

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
    supplier: req.body.supplier || "",
    quantity: Number(req.body.quantity) || 0,
    unit: req.body.unit || "units"
  });

  try {
    await food.save();

    // Log initial supply in transactions history if quantity is set
    if (food.quantity > 0 && food.supplier) {
      const supply = new supplyModel({
        materialId: food._id,
        materialName: food.name,
        supplierName: food.supplier,
        quantity: food.quantity,
        price: food.price,
        unit: food.unit
      });
      await supply.save();
    }

    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

//all list food
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// update food item
const updateFood = async (req, res) => {
  try {
    const foodId = req.body.id || req.body._id;

    if (!foodId) {
      return res.json({ success: false, message: "Food id is required" });
    }

    const existingFood = await foodModel.findById(foodId);

    if (!existingFood) {
      return res.json({ success: false, message: "Food not found" });
    }

    const updatedFoodData = {
      name: req.body.name ?? existingFood.name,
      description: req.body.description ?? existingFood.description,
      price: req.body.price ?? existingFood.price,
      category: req.body.category ?? existingFood.category,
      supplier: req.body.supplier ?? existingFood.supplier,
      quantity: req.body.quantity ?? existingFood.quantity,
      unit: req.body.unit ?? existingFood.unit,
    };

    if (req.file) {
      fs.unlink(`images/${existingFood.image}`, () => {});
      updatedFoodData.image = req.file.filename;
    }

    const updatedFood = await foodModel.findByIdAndUpdate(foodId, updatedFoodData, {
      new: true,
      runValidators: true,
    });

    // Log supply update transaction if quantity has been increased
    const diff = Number(req.body.quantity || 0) - Number(existingFood.quantity || 0);
    if (diff > 0 && updatedFood.supplier) {
      const supply = new supplyModel({
        materialId: updatedFood._id,
        materialName: updatedFood.name,
        supplierName: updatedFood.supplier,
        quantity: diff,
        price: updatedFood.price,
        unit: updatedFood.unit
      });
      await supply.save();
    }

    res.json({ success: true, message: "Food Updated", data: updatedFood });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

//remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    fs.unlink(`images/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get all food categories
const getFoodCategories = async (req, res) => {
  try {
    res.json({ success: true, data: foodCategories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching categories" });
  }
};

// Get food items by category
const getFoodByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const foodItems =
      category && category !== "All"
        ? await foodModel.find({ category })
        : await foodModel.find({});

    res.json({ success: true, data: foodItems });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching food by category" });
  }
};

// Increment stock quantity
const addStockQuantity = async (req, res) => {
  const { id, quantity } = req.body;
  if (!id || quantity === undefined) {
    return res.json({ success: false, message: "ID and quantity are required" });
  }

  try {
    const food = await foodModel.findById(id);
    if (!food) {
      return res.json({ success: false, message: "Food not found" });
    }

    const diff = Number(quantity);
    food.quantity = (food.quantity || 0) + diff;
    await food.save();

    // Log supply transaction log
    if (diff > 0 && food.supplier) {
      const supply = new supplyModel({
        materialId: food._id,
        materialName: food.name,
        supplierName: food.supplier,
        quantity: diff,
        price: food.price,
        unit: food.unit
      });
      await supply.save();
    }

    res.json({ success: true, message: "Stock quantity updated successfully", quantity: food.quantity });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating stock quantity" });
  }
};

// Fetch supply transaction history log
const listSupplies = async (req, res) => {
  try {
    const supplies = await supplyModel.find({}).sort({ date: -1 });
    res.json({ success: true, data: supplies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching supply history" });
  }
};

export { addFood, updateFood, listFood, removeFood, getFoodCategories, getFoodByCategory, addStockQuantity, listSupplies };
