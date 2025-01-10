import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullname: { type: String, required: false },
    nickname: { type: String, required: true },
    matno: { type: String, required: false, unique: true },
    level: { type: Number, required: false },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    electionIsActive: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSchema)
export default Admin;
