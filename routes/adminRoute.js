import express from "express";
import jwt from "jsonwebtoken";
import { getCurrentAdmin, logAdminAction, login, signup, updatePassword, allAdmins } from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token || !token.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const actualToken = token.split(" ")[1];
  jwt.verify(actualToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }
    req.admin = decoded; // Add user data to request
    next();
  });
};

router.post("/log-admin-action", logAdminAction);
router.post("/signup", signup);
router.post("/login", login);
router.get("/me",verifyToken, getCurrentAdmin);
router.put("/update-password", verifyAdmin  , updatePassword);
router.get("/all", allAdmins);

export default router;
