import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isStoppedManually: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Timer", TimerSchema);
