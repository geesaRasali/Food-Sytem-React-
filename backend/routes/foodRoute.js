import express from "express";
import multer from "multer";
import {
  addFood,
  updateFood,
  listFood,
  removeFood,
  addStockQuantity,
  listSupplies,
  addTransfer,
  listTransfers,
  addCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/foodController.js";
import authMiddleware from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import { FOOD_WRITE_ROLES } from "../constants/roles.js";

const foodRouter = express.Router();


const storage = multer.diskStorage({
  destination: "images",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

//food 
foodRouter.post("/add", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), addFood);
foodRouter.post("/update", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), updateFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), removeFood);
foodRouter.post("/add-stock", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), addStockQuantity);
foodRouter.get("/supplies", listSupplies);
foodRouter.post("/transfers/add", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), addTransfer);
foodRouter.get("/transfers", listTransfers);

//categery 
foodRouter.post("/category/add", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), addCategory);
foodRouter.get("/category/list", listCategories);
foodRouter.post("/category/update", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), updateCategory);
foodRouter.post("/category/delete", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), deleteCategory);

export default foodRouter;
