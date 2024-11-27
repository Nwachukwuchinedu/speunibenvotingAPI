import express from "express";
import {
  position,
  getPostions,
  vote,
  result,
  updateCandidate,
} from "../controllers/voteController.js";
import upload from "../config/multerConfig.js";

const router = express.Router();

// Routes
router.post("/position/add", upload.single("picture"), position);
router.get("/position/all", getPostions);
router.post("/vote/cast", vote);
router.get("/vote/result", result);
router.put(
  "/position/:id/candidate/update",
  upload.single("picture"),
  updateCandidate
);

export default router;