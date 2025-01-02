import Timer from "../models/Timer.js";

export const setTimer = async (req, res) => {
  const { startTime, endTime } = req.body;

  try {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const now = new Date();
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      endHours,
      endMinutes
    );
    const endTimestamp = end.getTime(); // Store countdown end time

    let timer = await Timer.findOne();
    if (timer) {
      timer.startTime = startTime;
      timer.endTime = endTime;
      timer.isActive = false;
      timer.endTimestamp = endTimestamp;
      await timer.save();
    } else {
      timer = new Timer({ startTime, endTime, isActive: false, endTimestamp });
      await timer.save();
    }

    res.json({ message: "Timer saved successfully", timer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save timer" });
  }
};

export const getTimer = async (req, res) => {
   try {
     const timer = await Timer.findOne();
     res.json(timer || {});
   } catch (err) {
     console.error(err);
     res.status(500).json({ error: "Failed to fetch timer" });
   }
};

export const startTimer = async (req, res) => {
  try {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not set" });

    timer.isActive = true;
    await timer.save();

    res.json({ message: "Election started", timer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start election" });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const timer = await Timer.findOne();
    if (!timer) return res.status(404).json({ error: "Timer not set" });

    timer.isActive = false;
    timer.endTimestamp = null;
    await timer.save();

    res.json({ message: "Election ended", timer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to end election" });
  }
};
