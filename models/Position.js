import mongoose from "mongoose";

const PositionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  candidates: [
    {
      name: { type: String, required: true },
      picture: { type: String }, 
    },
  ],
});

const Position = mongoose.model("Position", PositionSchema);

export default Position;
