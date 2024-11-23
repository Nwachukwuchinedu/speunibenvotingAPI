import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // You can use other services like Outlook, Yahoo, etc.
  auth: {
    user: "chinedusimeon2020@gmail.com", // Your Gmail address
    pass: "miseopnfheyyjapz", // Your email password or app password
  },
});

// Utility function to generate JWT with expiration and issuer
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "6h",
    issuer: "speunibenvoting",
  });
};

// Signup controller
export const signup = async (req, res) => {
  const { email, matno, level, password } = req.body;

  if (!email || !matno || !level || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate email
  if (!email.endsWith("@eng.uniben.edu")) {
    return res
      .status(400)
      .json({ message: "Email must end with '@eng.uniben.edu'" });
  }

  // Validate matno
  if (!matno.startsWith("ENG") || matno.length !== 10) {
    return res.status(400).json({
      message:
        "Matriculation number must start with 'ENG' and be 10 characters long",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      matno,
      level,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate a verification token
    const verificationToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-account?token=${verificationToken}`;

    // Send email
   await transporter.sendMail({
     from: "chinedusimeon2020@gmail.com",
     to: email,
     subject: "Verify Your Account",
     html: `
    <div style="
      font-family: Arial, sans-serif; 
      background-color: #f9f9f9; 
      padding: 20px; 
      text-align: center; 
      color: #333;">
      <div style="
        max-width: 600px; 
        margin: auto; 
        background: #ffffff; 
        border-radius: 10px; 
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
        overflow: hidden;">
        <div style="
          background: #4CAF50; 
          color: white; 
          padding: 15px 20px;">
          <h1 style="margin: 0; font-size: 24px;">Verify Your Account</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there! Thank you for signing up. To complete your registration, please verify your email by clicking the button below.
          </p>
          <a href="${verificationLink}" style="
            display: inline-block; 
            text-decoration: none; 
            background-color: #4CAF50; 
            color: white; 
            padding: 12px 25px; 
            font-size: 16px; 
            border-radius: 5px;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);">
            Verify Account
          </a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="
            word-break: break-word; 
            font-size: 14px; 
            color: #4CAF50;">
            <a href="${verificationLink}" style="color: #4CAF50; text-decoration: none;">${verificationLink}</a>
          </p>
        </div>
        <div style="
          background: #f1f1f1; 
          color: #777; 
          font-size: 12px; 
          padding: 10px 20px;">
          <p style="margin: 0;">
            If you did not sign up for this account, please ignore this email.
          </p>
          <p style="margin-top: 5px;">&copy; 2024 Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </div>
  `,
   });


    res.status(201).json({
      message: "Signup successful. Check your email to verify your account.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify account controller
export const verifyAccount = async (req, res) => {
  const { token } = req.query; // Token passed as a query parameter

  if (!token) {
    return res.status(400).json({ message: "Verification token is required" });
  }

  try {
    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Update the verified status
    user.verified = true;
    await user.save();

    res.status(200).json({ message: "Account successfully verified" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Invalid or expired token", error: err.message });
  }
};

// Login controller
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ email: "Email not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ password: "Password does not match" });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Refresh token controller
export const refreshToken = (req, res) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    { ignoreExpiration: true },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token." });
      }

      const newToken = generateToken(decoded.id);
      res.status(200).json({ token: newToken });
    }
  );
};

// Get current user controller (protected route)
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // Access the user ID from the decoded token
    const user = await User.findById(userId).select("-password"); // Don't send password back
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user); // Return the user data
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
