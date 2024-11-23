import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import authRoutes from "./routes/authRoutes.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const connection = mongoose.connect(process.env.MONGODB_URI);

connection.then(() => {
  console.log("MongoDB Connected");
});

connection.catch((err) => {
  console.log(err);
});

app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
