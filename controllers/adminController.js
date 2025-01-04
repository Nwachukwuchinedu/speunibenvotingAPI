import Admin from "../models/Admin.js";
import ActionLog from "../models/AdminActionLog.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "6h",
    issuer: "speunibenvoting",
  });
};

export const signup = async (req, res) => {
  const { email, matno, level, password } = req.body;

  if (!email || !matno || !level || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate matno
  if (!matno.startsWith("ENG") || matno.length !== 10) {
    return res.status(400).json({
      message:
        "Matriculation number must start with 'ENG' and be 10 characters long",
    });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      email,
      matno,
      level,
      password: hashedPassword,
    });

    await newAdmin.save();

    // Generate a verification token
    const verificationToken = jwt.sign(
      { id: newAdmin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );


    res.status(201).json({
      message: "Signup successful. Check your email to verify your account.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ email: "Email not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ password: "Password does not match" });
    }

    const token = generateToken(admin._id);
    res.status(200).json({
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getCurrentAdmin = async (req, res) => {
  try {
    const adminId = req.admin.id; // Access the user ID from the decoded token
    const admin = await Admin.findById(adminId).select("-password"); // Don't send password back
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin); // Return the user data
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Function to log admin actions with full details
export const logAdminAction = async (req, res) => {
  try {
    const { adminId, adminEmail, action, details } = req.body;

    // Ensure required fields are provided
    if (!adminId || !adminEmail || !action || !details) {
      return res
        .status(400)
        .json({
          message: "Admin ID, email, action, and full details are required.",
        });
    }

    // Create a new action log
    const newActionLog = new ActionLog({
      adminId,
      adminEmail,
      action,
      details, // Full action details
    });

    // Save the action log to the database
    const savedLog = await newActionLog.save();

    res.status(201).json({
      message: "Admin action logged successfully.",
      log: savedLog,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while logging the action." });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body; // Get the current password and new password

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required" });
  }

  try {
    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, req.admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    req.admin.password = hashedPassword;
    await req.admin.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};