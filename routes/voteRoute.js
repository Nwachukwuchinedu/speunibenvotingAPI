import express from "express";
import {
  position,
  getPostions,
  vote,
  result,
  updateCandidate,
  deleteCandidate,
  deletePosition,
  hasUserVoted,
} from "../controllers/voteController.js";
import upload from "../config/multerConfig.js";

const router = express.Router();

// Routes
router.post("/position/add", upload.single("picture"), position);
router.get("/position/all", getPostions);
router.post("/vote/cast", vote);
router.post("/vote/has-voted", hasUserVoted);
router.get("/vote/result", result);
router.put(
  "/position/:positionId/candidate/:candidateId/update",
  upload.single("picture"),
  updateCandidate
);
router.delete(
  "/position/:positionId/candidate/:candidateId/delete",
  deleteCandidate
);
router.delete("/position/:id/delete", deletePosition);

export default router;
