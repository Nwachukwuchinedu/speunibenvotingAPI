import mongoose from "mongoose";

const ActionLogSchema = new mongoose.Schema({
  adminId: { type: String, required: true }, // ID of the admin
  adminEmail: { type: String, required: true }, // Email of the admin
  action: { type: String, required: true }, // Short description of the action
  details: { type: Object, required: true }, // Full details of the action
  date: { type: Date, default: Date.now }, // Timestamp
});

const ActionLog = mongoose.model("ActionLog", ActionLogSchema);

export default ActionLog;
