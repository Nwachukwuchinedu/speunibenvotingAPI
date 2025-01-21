import fs from "fs";
import path from "path";
import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import fs1 from "fs/promises";
import pLimit from "p-limit"; // Ensure you install this with npm install p-limit
const router = express.Router();

// Function to generate a random password
function generateRandomPassword(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return password;
}

// Controller to fetch all emails, generate passwords, and save to file
async function generateAndSavePasswords(req, res) {
  try {
    // Fetch all users from the database
    const users = await User.find({}, "email"); // Fetch only email field

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Array to store email-password pairs
    const emailPasswordPairs = [];

    // Iterate over users and generate random passwords
    for (const user of users) {
      const randomPassword = generateRandomPassword();

      const randomHashPassword = await bcrypt.hash(randomPassword, 10);

      // Update the user in the database with the new password
      await User.findByIdAndUpdate(user._id, { password: randomHashPassword });

      // Add email-password pair to the array
      emailPasswordPairs.push({ email: user.email, password: randomPassword });
    }

    // Save the email-password pairs to a JSON file
    const filePath = path.join(process.cwd(), "email_passwords.json");
    fs.writeFileSync(filePath, JSON.stringify(emailPasswordPairs, null, 2));

    // Respond to the request
    res.status(200).json({
      message: "Passwords generated and saved successfully",
      filePath,
    });
  } catch (error) {
    console.error("Error generating passwords:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
}

// Controller to send passwords to all users via email
async function sendPasswordsByEmail(req, res) {
  try {
    // Read the email-password pairs from the JSON file
    const filePath = path.join(process.cwd(), "email_passwords.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "No password file found. Please generate passwords first.",
      });
    }

    const emailPasswordPairs = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Replace with your email provider
      auth: {
        user: "chinedusimeon2020@gmail.com", // Your Gmail address
        pass: "miseopnfheyyjapz", // Your email password or app password
      },
    });

    // Send email to each user
    for (const pair of emailPasswordPairs) {
      const mailOptions = {
        from: "chinedusimeon2020@gmail.com",
        to: pair.email,
        subject: "SPE UNIBEN Election - Your Password",
        html: `
      <div style="
        font-family: 'Montserrat',  sans-serif;
        background-color: #f9f9f9;
        padding: 20px;
        text-align: center;
        color: #333;">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap');
        </style>
        <div style="
          max-width: 600px;
          margin: auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          overflow: hidden;">
          <div style="padding: 20px 20px 0;">
            <img src="https://speunibenvoting.vercel.app/assets/spelogo-CmFXs7lC.jpeg" alt="Logo" style="width: 150px; height: auto;" />
          </div>
          <div style="
            background: #1c80df;
            color: white;
            padding: 15px 20px;">
            <h1 style="margin: 0; font-size: 24px; font-family: 'Montserrat',  sans-serif;">Your New Password</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; margin-bottom: 20px; color: #333; font-family: 'Montserrat',  sans-serif;">
              Hello,<br/><br/>
              Your password is: <strong>${pair.password}</strong><br/><br/>
              Please keep it secure and do not share it with anyone.
            </p>
          </div>
          <div style="
            background: #f1f1f1;
            color: #777;
            font-size: 12px;
            padding: 10px 20px;">
            <p style="margin: 0; font-family: 'Montserrat',  sans-serif;">
              Need help? Check out our <a href="https://wa.me/+2347039173729" style="color: #1c80df; text-decoration: none;">Help Center</a> or contact support.
            </p>
            <p style="margin-top: 5px; font-family: 'Montserrat',  sans-serif;">&copy; 2024 SPE UNIBEN ELECO Team. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
      };

      await transporter.sendMail(mailOptions);
    }

    res
      .status(200)
      .json({ message: "Passwords sent to all users successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({
      message: "An error occurred while sending emails",
      error: error.message,
    });
  }


}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const sendPasswordsToUsers = async (req, res) => {
  try {
    // Load email and password data from the JSON file
    const emailPasswordData = JSON.parse(
      await fs1.readFile("email_passwords.json", "utf-8")
    );

    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "chinedusimeon2020@gmail.com",
        pass: "miseopnfheyyjapz", // Use environment variables or app-specific password
      },
    });

    // Utility function for a delay
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Limit concurrency to 10 emails at a time
    const limit = pLimit(10);

    const emailPromises = emailPasswordData.map(({ email, password }, index) =>
      limit(async () => {
        // Introduce delay between emails to avoid rate limits
        await delay(index * 1000); // Adjust delay as needed (1000ms per email)
        await transporter.sendMail({
          from: "chinedusimeon2020@gmail.com",
          to: email,
          subject: "Your Account Password",
          html: `
          <div style="font-family: 'Montserrat', sans-serif; background-color: #f9f9f9; padding: 20px; text-align: center; color: #333;">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Poppins:wght@300;500&display=swap');
            </style>
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <div style="background: #1c80df; color: white; padding: 15px;">
                <h1 style="margin: 0; font-size: 24px;">Your New Password</h1>
              </div>
              <div style="padding: 20px;">
                <p>Hello,</p>
                <p>Your account password has been updated. Here is your new password:</p>
                <p style="font-size: 20px; font-weight: bold; color: #1c80df;">${password}</p>
                <p>Please keep it secure and do not share it with anyone.</p>
              </div>
              <div style="background: #f1f1f1; color: #777; font-size: 12px; padding: 10px;">
                <p>Need help? Contact support at <a href="mailto:support@example.com" style="color: #1c80df;">support@example.com</a></p>
              </div>
            </div>
          </div>
          `,
        });
        console.log(`Email sent to ${email}`);
      })
    );

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    res
      .status(200)
      .json({ message: "Passwords sent to all users successfully." });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ error: "Failed to send emails to users." });
  }
};


// Route to generate passwords and save them
router.post("/generate-passwords", generateAndSavePasswords);

// Route to send passwords via email
router.post("/send-passwords", sendPasswordsToUsers);

export default router;
