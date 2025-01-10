import Position from "../models/Position.js";
import Vote from "../models/Vote.js";
import User from "../models/User.js";
import autoCommitAndPush from "../utils/gitAutoPush.js";
import fs from "fs";

import multer from "multer";

export const position = async (req, res) => {
  const { name, candidates } = req.body;

  try {
    // Check if the position already exists
    const existingPosition = await Position.findOne({ name });

    if (existingPosition) {
      // Merge new candidates with existing candidates
      const existingCandidateIds = existingPosition.candidates.map((c) =>
        c._id.toString()
      );
      console.log(existingCandidateIds);

      const newCandidates = JSON.parse(candidates)
        .map((candidate) => ({
          ...candidate,
          picture: req.file?.path || null, // Assign picture path if uploaded
        }))
        .filter((candidate) => !existingCandidateIds.includes(candidate._id));

      existingPosition.candidates.push(...newCandidates);

      autoCommitAndPush(req.file?.path); // Commit and push the file to GitHub
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

export const updateCandidate = async (req, res) => {
  const { positionId, candidateId } = req.params; // Position and Candidate IDs
  const { name } = req.body; // Candidate name
  const file = req.file; // Uploaded picture

  try {
    // Find the position by ID
    const position = await Position.findById(positionId);

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
  const { positionId, candidateId } = req.params;

  try {
    // Find the position
    const position = await Position.findById(positionId);
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
        position &&
        position.candidates.some((c) => c._id.toString() === vote.candidateId) // Updated to use `_id`
      );
    });

    if (!validVotes) {
      return res.status(400).send("Invalid vote data.");
    }

    // Save votes
    const newVote = new Vote({ voterId, votes });
    await newVote.save();

    const user = await User.findOne({ matno: voterId });
    user.voted = true;
    await user.save();
    console.log(user);

    res.status(201).send("Vote cast successfully");
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).send("Error casting vote: " + error.message);
  }
};

export const hasUserVoted = async (req, res) => {
  const { voterId } = req.body; // Extract voterId from the request body

  try {
    // Check if the voterId exists in the database
    const voterExists = await Vote.findOne({ voterId });

    if (voterExists) {
      return res.status(200).json({
        hasVoted: true,
        message: "User has already voted.",
      });
    }

    return res.status(200).json({
      hasVoted: false,
      message: "User has not voted yet.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error checking voting status",
      error: error.message,
    });
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
              vote.candidateId === candidate._id.toString()
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

export const invalidateVote = async (req, res) => {
  try {
    const { voterId } = req.body; // Expect voterId to be passed in the request body

    if (!voterId) {
      return res.status(400).json({ message: "Voter ID is required" });
    }

    // Find and delete the voter's record
    const deletedVote = await Vote.findOneAndDelete({ voterId });

    if (!deletedVote) {
      return res
        .status(404)
        .json({ message: "Vote not found or already invalidated" });
    }

    return res.status(200).json({ message: "Vote invalidated successfully" });
  } catch (error) {
    console.error("Error invalidating vote:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while invalidating the vote" });
  }
};

export const getAllVotes = async (req, res) => {
  try {
    // Fetch all data from the Vote collection
    const votes = await Vote.find();
    const voterCount = votes.length;

    // Respond with the fetched data
    res.status(200).json({ voterCount });
  } catch (error) {
    console.error("Error fetching votes:", error);

    // Handle errors
    res.status(500).json({
      success: false,
      message: "Failed to fetch votes",
      error: error.message,
    });
  }
};

// import PDFDocument from "pdfkit";
// import { ChartJSNodeCanvas } from "chartjs-node-canvas";
// import path from "path";

// export const result = async (req, res) => {
//   try {
//     const positions = await Position.find();
//     const votes = await Vote.find();

//     const results = positions.map((position) => {
//       const counts = position.candidates.map((candidate) => {
//         const voteCount = votes.filter((v) =>
//           v.votes.some(
//             (vote) =>
//               vote.position === position.name &&
//               vote.candidateId === candidate._id.toString()
//           )
//         ).length;

//         return { candidate: candidate.name, votes: voteCount };
//       });

//       return { position: position.name, results: counts };
//     });

//     // Generate the PDF with charts
//     const pdfPath = path.join("results", `vote_results_${Date.now()}.pdf`);
//     const doc = new PDFDocument();
//     const chartCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });

//     // Add Title
//     doc.font("Poppins-Bold").fontSize(20).text("Election Results", {
//       align: "center",
//     });
//     doc.moveDown();

//     for (const result of results) {
//       // Add Position Title
//       doc.font("Montserrat-Bold").fontSize(16).text(result.position, {
//         align: "left",
//       });

//       // Prepare Data for Chart
//       const labels = result.results.map((r) => r.candidate);
//       const data = result.results.map((r) => r.votes);

//       const chartConfig = {
//         type: "bar",
//         data: {
//           labels,
//           datasets: [
//             {
//               label: `Votes for ${result.position}`,
//               data,
//               backgroundColor: "rgba(75, 192, 192, 0.2)",
//               borderColor: "rgba(75, 192, 192, 1)",
//               borderWidth: 1,
//             },
//           ],
//         },
//         options: {
//           plugins: {
//             legend: { display: false },
//           },
//         },
//       };

//       // Generate Chart
//       const chartImage = await chartCanvas.renderToBuffer(chartConfig);

//       // Save Chart to PDF
//       const chartPath = path.join("charts", `chart_${result.position}.png`);
//       fs.writeFileSync(chartPath, chartImage);

//       doc.image(chartPath, { width: 400 }).moveDown();

//       // Clean up chart image
//       fs.unlinkSync(chartPath);
//     }

//     // Finalize and Save PDF
//     doc.pipe(fs.createWriteStream(pdfPath));
//     doc.end();

//     res.status(200).json({ message: "Results generated and saved to PDF." });
//   } catch (error) {
//     res.status(500).send("Error fetching results: " + error.message);
//   }
// };
