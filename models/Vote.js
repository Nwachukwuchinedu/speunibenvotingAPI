import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema({
  voterId: { type: String, required: true, unique: true },
  votes: [
    {
      position: { type: String, required: true },
      candidateId: { type: String, required: true },
    },
  ],
});

const Vote = mongoose.model("Vote", VoteSchema);

export default Vote
