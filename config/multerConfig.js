import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the current directory of the file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory inside the frontend project
const frontendUploadDir = path.join(
  "C:/Users/Simeon/OneDrive/Documents/coding/speunibenvoting/public/uploads"
);

// Create the directory if it doesn't exist
if (!fs.existsSync(frontendUploadDir)) {
  fs.mkdirSync(frontendUploadDir, { recursive: true });
}

// Configure Multer for storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, frontendUploadDir); // Save files in the frontend's uploads directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedFileName}`);
  },
});

// Filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Initialize Multer
const upload = multer({ storage, fileFilter });

export default upload;

// Example route to handle file uploads
export const uploadHandler = async (req, res) => {
  try {
    // Save the relative path for the file
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `http://localhost:5173${relativePath}`; // URL to access the file from the frontend

    res.status(200).json({
      message: "File uploaded successfully.",
      fileUrl: fullUrl, // URL to access the file from the frontend
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "File upload failed.", error: error.message });
  }
};
