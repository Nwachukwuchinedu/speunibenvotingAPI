import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import Position from "./models/Position.js";
import Vote from "./models/Vote.js";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import voteRoutes from "./routes/voteRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import timerRoute from "./routes/timerRoute.js";

import generatePassword from './controllers/randomPassword.js';
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcrypt";

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the "uploads" directory  
app.use("/upload", express.static("upload"));

const connection = mongoose.connect(process.env.MONGODB_URI);

connection.then(() => {
  console.log("MongoDB Connected");
});

connection.catch((err) => {
  console.log(err);
});

app.use("/api/auth", authRoutes);
app.use("/api", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/timer", timerRoute);
app.use("/", generatePassword);

// Endpoint to read Excel data and save to a JSON file
app.get("/save-json", (req, res) => {
  // Load the Excel file
  const filePath = path.join(__dirname, "three.xlsx"); // Replace with your file's name
  const workbook = xlsx.readFile(filePath);

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(sheet);

  const seenEmails = new Set(); // To track unique emails
  const duplicateEmails = new Set(); // To log duplicate emails
  const filteredData = [];

  jsonData.forEach((row) => {
    const fullname = row["FULL NAME"];
    const email = row["Email Address"];
    const matricNumber = row["MATRICULATION NUMBER"];
    const password = row["SPE NUMBER"];

    // Skip rows with missing or invalid data
    // if (!fullname || !email || !matricNumber || !password) {
    //   console.warn(`Skipping row with missing data: ${JSON.stringify(row)}`);
    //   return;
    // }

    // Check for duplicate emails
    if (seenEmails.has(email)) {
      duplicateEmails.add(email); // Log duplicate email
    } else {
      seenEmails.add(email); // Mark email as seen
      filteredData.push({
        email,
        fullname,
        matno: matricNumber,
        level: 400,
        password,
        nickname: fullname.split(" ")[0], // Use the first name as the nickname
        verified: true,
      });
    }
  });


  // Log duplicate emails
  console.log("Duplicate emails found:", Array.from(duplicateEmails));

  // Path to save the JSON file
  const jsonFilePath = path.join(__dirname, "output-three.json");

  // Write the filtered data to a JSON file
  fs.writeFile(jsonFilePath, JSON.stringify(filteredData, null, 2), (err) => {
    if (err) {
      console.error("Error writing to JSON file:", err);
      res.status(500).send("Error saving JSON file.");
    } else {
      console.log("Data successfully saved to output.json");
      res.send({
        message: "Data successfully saved to output.json",
        duplicates: Array.from(duplicateEmails), // Return the duplicate emails in response
      });
    }
  });
});

// Path to the JSON file
 const jsonFilePath = path.join(__dirname, "output.json"); // Replace "data.json" with your JSON file name

// // Read the JSON file
 const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

// Insert Data into MongoDB

// const importData = async () => {
//   try {
//     // Insert each user into the database
//     const insertedUsers = await Promise.all(
//       jsonData.map(async (user) => {
//         const newUser = new User({
//           email: user.email,
//           fullname: user.fullname,
//           nickname: user.nickname,
//           matno: user.matno,
//           level: user.level,
//           password: await bcrypt.hash(String(user.password), 10),
//           verified: user.verified,
//         });

//         return newUser.save();
//       })
//     );
//     console.log("Data imported successfully:", insertedUsers);
//   } catch (err) {
//     console.error("Error importing data:", err);
//   }
// };

//  importData();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
