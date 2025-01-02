import mongoose from "mongoose";

const timerSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  endTimestamp: { type: Number }, // UNIX timestamp for countdown end
});

const Timer = mongoose.model("Timer", timerSchema);

export default Timer;
