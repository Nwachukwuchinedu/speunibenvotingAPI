import express from "express";
import { position, getPostions, vote, result } from "../controllers/voteController.js";

const router = express.Router();

// Routes
router.post("/position/add", position);
router.get("/position/all", getPostions);
router.post("/vote/cast", vote);
router.get("/vote/result", result);

export default router;
