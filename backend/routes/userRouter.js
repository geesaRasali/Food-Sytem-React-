import express from "express"
import multer from "multer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
	loginUser,
	registerUser,
	getUserProfile,
	updateUserProfile,
	googleLoginUser,
	listStaffUsers,
	createStaffUser,
	updateStaffUser,
	deleteStaffUser,
	countCustomers,
} 
from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js"
import { requireRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../constants/roles.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const imagesDir = path.resolve(__dirname, "..", "images")

if (!fs.existsSync(imagesDir)) {
	fs.mkdirSync(imagesDir, { recursive: true })
}

const storage = multer.diskStorage({
	destination: imagesDir,
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}${file.originalname}`);
	},
});

const upload = multer({ storage });
const uploadProfileImage = (req, res, next) => {
	upload.single("image")(req, res, (err) => {
		if (err) {
			return res.json({ success: false, message: err.message || "Image upload failed" })
		}
		next()
	})
}

const userRouter = express.Router()

userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
userRouter.post("/google-login",googleLoginUser)
userRouter.get("/profile",authMiddleware,getUserProfile)
userRouter.post("/update",authMiddleware,uploadProfileImage,updateUserProfile)
userRouter.get("/staff", authMiddleware, requireRoles(USER_ROLES.ADMIN, USER_ROLES.MANAGEMENT_STAFF, USER_ROLES.KITCHEN_STAFF), listStaffUsers)
userRouter.post("/staff", authMiddleware, requireRoles(USER_ROLES.ADMIN), createStaffUser)
userRouter.put("/staff/:id", authMiddleware, requireRoles(USER_ROLES.ADMIN), updateStaffUser)
userRouter.delete("/staff/:id", authMiddleware, requireRoles(USER_ROLES.ADMIN), deleteStaffUser)
userRouter.get("/customers/count", authMiddleware, requireRoles(USER_ROLES.ADMIN, USER_ROLES.MANAGEMENT_STAFF, USER_ROLES.STOREKEEPER), countCustomers)

export default userRouter;