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
} from "../controllers/foodController.js";
import authMiddleware from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import { FOOD_WRITE_ROLES } from "../constants/roles.js";

const foodRouter = express.Router();

//Image Storage Engine

const storage = multer.diskStorage({
  destination: "images",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

foodRouter.post("/add", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), addFood);
foodRouter.post("/update", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), upload.single("image"), updateFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), removeFood);
foodRouter.post("/add-stock", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), addStockQuantity);
foodRouter.get("/supplies", listSupplies);
foodRouter.post("/transfers/add", authMiddleware, requireRoles(...FOOD_WRITE_ROLES), addTransfer);
foodRouter.get("/transfers", listTransfers);

export default foodRouter;
