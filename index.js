import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import Position from "./models/Position.js";
import Vote from "./models/Vote.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import voteRoutes from "./routes/voteRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const connection = mongoose.connect(process.env.MONGODB_URI);

connection.then(() => {
  console.log("MongoDB Connected");
});

connection.catch((err) => {
  console.log(err);
});

app.use("/api/auth", authRoutes);
app.use("/api", voteRoutes);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
