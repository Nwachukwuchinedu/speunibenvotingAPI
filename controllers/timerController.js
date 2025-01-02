import Timer from "../models/Timer.js";

// Set Timer
export const setTimer = async (req, res) => {
  const { startTime, endTime } = req.body;

  try {
    // Create or Update Timer
    const timer = await Timer.findOneAndUpdate(
      {},
      { startTime, endTime, isActive: false, isStoppedManually: false },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Timer set successfully.",
      timer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to set timer.",
      error: error.message,
    });
  }
};

// Start Election
export const startElection = async (req, res) => {
  try {
    const timer = await Timer.findOne();
    if (!timer) {
      return res.status(404).json({ message: "Timer not found." });
    }

    const now = new Date();
    if (now < timer.startTime) {
      return res
        .status(400)
        .json({ message: "Election start time not reached." });
    }

    timer.isActive = true;
    await timer.save();

    res.status(200).json({
      message: "Election started successfully.",
      timer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to start election.",
      error: error.message,
    });
  }
};

// Stop Election
export const stopElection = async (req, res) => {
  try {
    const timer = await Timer.findOne();
    if (!timer) {
      return res.status(404).json({ message: "Timer not found." });
    }

    timer.isActive = false;
    timer.isStoppedManually = true;
    await timer.save();

    res.status(200).json({
      message: "Election stopped successfully.",
      timer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to stop election.",
      error: error.message,
    });
  }
};

// Get Timer Status
export const getTimerStatus = async (req, res) => {
  try {
    const timer = await Timer.findOne();
    if (!timer) {
      return res.status(404).json({ message: "Timer not found." });
    }

    res.status(200).json({
      message: "Timer status retrieved successfully.",
      timer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get timer status.",
      error: error.message,
    });
  }
};
