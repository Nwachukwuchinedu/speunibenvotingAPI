import Position from "../models/Position.js";
import Vote from "../models/Vote.js";
import User from "../models/User.js";

export const position = async (req, res) => {
  const { name, candidates } = req.body;

  try {
    // Check if the position already exists
    const existingPosition = await Position.findOne({ name });

    if (existingPosition) {
      // Merge new candidates with existing candidates
      const existingCandidateIds = existingPosition.candidates.map((c) => c.id);
      const newCandidates = candidates.filter(
        (candidate) => !existingCandidateIds.includes(candidate.id)
      );

      existingPosition.candidates.push(...newCandidates);

      await existingPosition.save();
      return res.status(200).send("Candidates added to existing position.");
    }

    // Create a new position if it doesn't exist
    const newPosition = new Position({ name, candidates });
    await newPosition.save();
    res.status(201).send("Position added successfully.");
  } catch (error) {
    res.status(400).send("Error adding position: " + error.message);
  }
};

export const getPostions = async (req, res) => {
  try {
    const positions = await Position.find();
    res.status(200).json(positions);
  } catch (error) {
    res.status(500).send("Error fetching positions: " + error.message);
  }
};

export const vote = async (req, res) => {
  try {
    const { voterId, votes } = req.body;

    if (!voterId || !votes || !Array.isArray(votes)) {
      return res.status(400).send("Invalid request payload.");
    }

    // Check if the voter has already voted
    const existingVote = await Vote.findOne({ voterId });
    if (existingVote) {
      return res.status(400).send("You have already voted.");
    }

    // Fetch all positions
    const allPositions = await Position.find();

    // Validate votes
    const validVotes = votes.every((vote) => {
      const position = allPositions.find((p) => p.name === vote.position);
      return (
        position && position.candidates.some((c) => c.id === vote.candidateId)
      );
    });

    if (!validVotes) {
      return res.status(400).send("Invalid vote data.");
    }

    // Save votes
    const newVote = new Vote({ voterId, votes });
    await newVote.save()

    const user = await User.findOne({matno: voterId});
    user.voted = true;
    await user.save();
    console.log(user);
    
    res.status(201).send("Vote cast successfully");
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).send("Error casting vote: " + error.message);
  }
};

export const result = async (req, res) => {
  try {
    const positions = await Position.find();
    const votes = await Vote.find();

    const results = positions.map((position) => {
      const counts = position.candidates.map((candidate) => {
        const voteCount = votes.filter((v) =>
          v.votes.some(
            (vote) =>
              vote.position === position.name &&
              vote.candidateId === candidate.id
          )
        ).length;

        return { candidate: candidate.name, votes: voteCount };
      });

      return { position: position.name, results: counts };
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).send("Error fetching results: " + error.message);
  }
};
