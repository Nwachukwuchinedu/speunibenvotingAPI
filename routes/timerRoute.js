import express from "express";
import {
  setTimer,
  startElection,
  stopElection,
  getTimerStatus,
} from "../controllers/timerController.js";

const router = express.Router();

router.post("/set-timer", setTimer);
router.post("/start-election", startElection);
router.post("/stop-election", stopElection);
router.get("/status", getTimerStatus);

export default router;
