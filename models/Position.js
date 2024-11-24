import mongoose from "mongoose";

const PositionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  candidates: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
});

const Position = mongoose.model("Position", PositionSchema);

export default Position
