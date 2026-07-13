import foodModel from "../models/foodModel.js";
import supplyModel from "../models/supplyModel.js";
import transferModel from "../models/transferModel.js";
import categoryModel from "../models/categoryModel.js";
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


const addFood = async (req, res) => {
  console.log("Request body:", req.body); 
  console.log("Request file:", req.file); 

  if (!req.file) {
    return res.json({ success: false, message: "Image is required" });
  }

  if (
    !req.body.name ||
    !req.body.description ||
    !req.body.price ||
    !req.body.category
  ) {
    return res.json({ success: false, message: "All fields are required" });
  }

  let image_filename = `${req.file.filename}`;

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
    supplier: req.body.supplier || "",
    quantity: Number(req.body.quantity) || 0,
    unit: req.body.unit || "units",
    expiryDate: req.body.expiryDate || null
  });

  try {
    await food.save();

    // Log initial supply in transactions history
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
      expiryDate: req.body.expiryDate ?? existingFood.expiryDate,
    };

    if (req.file) {
      fs.unlink(`images/${existingFood.image}`, () => {});
      updatedFoodData.image = req.file.filename;
    }

    const updatedFood = await foodModel.findByIdAndUpdate(foodId, updatedFoodData, {
      new: true,
      runValidators: true,
    });

    // Log supply update
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
    if (food) {
      fs.unlink(`images/${food.image}`, () => {});
    }

    await foodModel.findByIdAndDelete(req.body.id);
    
    // Clean supply logs from DB
    await supplyModel.deleteMany({ materialId: req.body.id });
    
    // Clean kitchen transfer loging
    await transferModel.deleteMany({ materialId: req.body.id });

    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// all food categories
const getFoodCategories = async (req, res) => {
  try {
    res.json({ success: true, data: foodCategories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching categories" });
  }
};

// food items by category
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

// stock quantity
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

// Fetch supply 
const listSupplies = async (req, res) => {
  try {
    const activeFoods = await foodModel.find({}, { _id: 1 });
    const activeFoodIds = activeFoods.map(f => f._id.toString());
    const supplies = await supplyModel.find({ materialId: { $in: activeFoodIds } }).sort({ date: -1 });
    res.json({ success: true, data: supplies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching supply history" });
  }
};

// 
const addTransfer = async (req, res) => {
  const { materialId, quantity, recipientSection } = req.body;
  if (!materialId || !quantity || !recipientSection) {
    return res.json({ success: false, message: "Material ID, quantity, and recipient section are required" });
  }

  try {
    const food = await foodModel.findById(materialId);
    if (!food) {
      return res.json({ success: false, message: "Material not found" });
    }

    const qtyToMove = Number(quantity);
    if (isNaN(qtyToMove) || qtyToMove <= 0) {
      return res.json({ success: false, message: "Valid quantity is required" });
    }

    const currentStock = Number(food.quantity) || 0;
    if (currentStock < qtyToMove) {
      return res.json({ success: false, message: "Insufficient stock quantity" });
    }

    // Decrement stock in food model
    food.quantity = currentStock - qtyToMove;
    await food.save();

    const transfer = new transferModel({
      materialId: food._id,
      materialName: food.name,
      category: food.category || '',
      quantity: qtyToMove,
      unit: food.unit || "units",
      recipientSection,
      status: 'Completed'
    });
    await transfer.save();

    res.json({ success: true, message: "Stock transferred successfully", data: transfer });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error performing stock transfer", error: error.message });
  }
};

const listTransfers = async (req, res) => {
  try {
    const { status } = req.query;
    const activeFoods = await foodModel.find({}, { _id: 1, category: 1 });
    const activeFoodIds = activeFoods.map(f => f._id);
    const foodCategoryMap = {};
    activeFoods.forEach(f => { foodCategoryMap[f._id.toString()] = f.category; });

    const filter = { materialId: { $in: activeFoodIds } };
    if (status) filter.status = status;

    const transfers = await transferModel.find(filter).sort({ date: -1 });

    
    const enriched = transfers.map(t => {
      const obj = t.toObject();
      if (!obj.category) {
        obj.category = foodCategoryMap[obj.materialId?.toString()] || '';
      }
      if (!obj.status) {
        obj.status = 'Completed';
      }
      return obj;
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching transfers history" });
  }
};

/** Add a new category*/
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res.json({ success: false, message: "Category name is required" });
    }

    const existing = await categoryModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res.json({ success: false, message: "Category already exists" });
    }

    const category = new categoryModel({
      name: name.trim(),
      image: req.file ? req.file.filename : "",
    });
    await category.save();
    res.json({ success: true, message: "Category added", data: category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding category" });
  }
};

/** List all categories */
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({}).sort({ createdAt: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching categories" });
  }
};

/** Update a category name and/or image */
const updateCategory = async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res.json({ success: false, message: "Category id is required" });
    }

    const category = await categoryModel.findById(id);
    if (!category) {
      if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
      return res.json({ success: false, message: "Category not found" });
    }

    if (name && name.trim()) {
      // Check uniqueness 
      const duplicate = await categoryModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (duplicate) {
        if (req.file) fs.unlink(`images/${req.file.filename}`, () => {});
        return res.json({ success: false, message: "Category name already exists" });
      }
      category.name = name.trim();
    }

    if (req.file) {
      // Delete old image 
      if (category.image) fs.unlink(`images/${category.image}`, () => {});
      category.image = req.file.filename;
    }

    await category.save();
    res.json({ success: true, message: "Category updated", data: category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating category" });
  }
};

/** Delete a category and its image */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "Category id is required" });

    const category = await categoryModel.findById(id);
    if (!category) return res.json({ success: false, message: "Category not found" });

    if (category.image) fs.unlink(`images/${category.image}`, () => {});
    await categoryModel.findByIdAndDelete(id);

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error deleting category" });
  }
};

export { 
  addFood, 
  updateFood, 
  listFood, 
  removeFood, 
  getFoodCategories, 
  getFoodByCategory, 
  addStockQuantity, 
  listSupplies,
  addTransfer,
  listTransfers,
  addCategory,
  listCategories,
  updateCategory,
  deleteCategory,
};
