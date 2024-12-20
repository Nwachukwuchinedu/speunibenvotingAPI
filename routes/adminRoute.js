import express from "express";

import { getCurrentAdmin, logAdminAction, login, signup } from "../controllers/adminController.js";

const router = express.Router();

router.post("/log-admin-action", logAdminAction);
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", getCurrentAdmin);

export default router;
