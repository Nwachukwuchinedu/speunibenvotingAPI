import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// Authentication Middleware
export const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    const admin = await Admin.findById(decoded.id); // Find the admin by ID stored in the token

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = admin; // Attach admin data to the request object
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid token" });
  }
};
