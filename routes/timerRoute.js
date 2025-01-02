import express from "express";
import { getTimer, setTimer, startTimer, stopTimer } from "../controllers/timerController.js";

const router = express.Router()

router.post("/", setTimer);
router.get("/", getTimer);
router.post("/start", startTimer);
router.post("/stop", stopTimer);

export default router