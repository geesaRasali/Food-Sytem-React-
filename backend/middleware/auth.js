import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  const authHeader =
    req.headers.token || req.headers.authorization || req.query?.token;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader;

  if (!token) {
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel
      .findById(token_decode.id)
      .select("_id role name email username");

    if (!user) {
      return res.json({
        success: false,
        message: "User not found, please login again",
      });
    }

    req.body = req.body || {};
    req.userId = token_decode.id;
    req.body.userId = token_decode.id;
    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
      username: user.username,
    };
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Invalid token, please login again" });
  }
};

export default authMiddleware;
