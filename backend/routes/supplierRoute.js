import express from "express";
import {
  addSupplier,
  listSuppliers,
  updateSupplier,
  removeSupplier
} from "../controllers/supplierController.js";
import authMiddleware from "../middleware/auth.js";
import { requireRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../constants/roles.js";

const supplierRouter = express.Router();

const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.MANAGEMENT_STAFF, USER_ROLES.STOREKEEPER];

supplierRouter.post("/add", authMiddleware, requireRoles(...allowedRoles), addSupplier);
supplierRouter.get("/list", authMiddleware, requireRoles(...allowedRoles), listSuppliers);
supplierRouter.post("/update", authMiddleware, requireRoles(...allowedRoles), updateSupplier);
supplierRouter.post("/remove", authMiddleware, requireRoles(...allowedRoles), removeSupplier);

export default supplierRouter;
