import Position from "../models/Position.js";
import Vote from "../models/Vote.js";
import User from "../models/User.js";
import fs from "fs";

import multer from "multer";

export const position = async (req, res) => {
  const { name, candidates } = req.body;

  try {
    // Check if the position already exists
    const existingPosition = await Position.findOne({ name });

    if (existingPosition) {
      // Merge new candidates with existing candidates
      const existingCandidateIds = existingPosition.candidates.map((c) => c.id);
      const newCandidates = JSON.parse(candidates)
        .map((candidate) => ({
          ...candidate,
          picture: req.file?.path || null, // Assign picture path if uploaded
        }))
        .filter((candidate) => !existingCandidateIds.includes(candidate.id));

      existingPosition.candidates.push(...newCandidates);

      await existingPosition.save();
      return res.status(200).send("Candidates added to existing position.");
    }

    // Create a new position if it doesn't exist
    const newCandidates = JSON.parse(candidates).map((candidate) => ({
      ...candidate,
      picture: req.file?.path || null, // Assign picture path if uploaded
    }));

    const newPosition = new Position({ name, candidates: newCandidates });
    await newPosition.save();
    res.status(201).send("Position added successfully.");
  } catch (error) {
    res.status(400).send("Error adding position: " + error.message);
  }
};

// Controller to update a specific candidate
export const updateCandidate = async (req, res) => {
  const { id } = req.params; // Position ID
  const { candidateId, name } = req.body; // Candidate details
  const file = req.file; // Uploaded picture

  try {
    // Find the position by ID
    const position = await Position.findById(id);
    if (!position) {
      return res.status(404).json({ message: "Position not found." });
    }

    // Find the candidate within the candidates array
    const candidate = position.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    // Update candidate details
    if (name) candidate.name = name;
    if (file) {
      // Delete the old picture if it exists
      if (candidate.picture && fs.existsSync(candidate.picture)) {
        fs.unlinkSync(candidate.picture);
      }
      // Update the picture path
      candidate.picture = file.path;
    }

    // Save the updated position document
    await position.save();
    res
      .status(200)
      .json({ message: "Candidate updated successfully.", position });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating candidate: " + error.message });
  }
};

// Controller to delete a specific candidate
export const deleteCandidate = async (req, res) => {
  const { id } = req.params; // Position ID
  const { candidateId } = req.body; // Candidate ID to delete

  try {
    // Find the position
    const position = await Position.findById(id);
    if (!position) {
      return res.status(404).json({ message: "Position not found." });
    }

    // Find the candidate within the candidates array
    const candidateIndex = position.candidates.findIndex(
      (c) => c.id === candidateId
    );
    if (candidateIndex === -1) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    // Remove the candidate's picture from the filesystem if it exists
    const candidate = position.candidates[candidateIndex];
    if (candidate.picture && fs.existsSync(candidate.picture)) {
      fs.unlinkSync(candidate.picture);
    }

    // Remove the candidate from the array
    position.candidates.splice(candidateIndex, 1);

    // Save the updated position
    await position.save();
    res
      .status(200)
      .json({ message: "Candidate deleted successfully.", position });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting candidate: " + error.message });
  }
};

// Controller to get all positions
export const deletePosition = async (req, res) => {
  const { id } = req.params; // Position ID

  try {
    // Find the position
    const position = await Position.findById(id);
    if (!position) {
      return res.status(404).json({ message: "Position not found." });
    }

    // Delete candidate pictures from the filesystem
    for (const candidate of position.candidates) {
      if (candidate.picture && fs.existsSync(candidate.picture)) {
        fs.unlinkSync(candidate.picture);
      }
    }

    // Delete the position
    await Position.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Position and its candidates deleted successfully." });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting position: " + error.message });
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
