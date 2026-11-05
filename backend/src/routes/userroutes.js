import { Router } from "express";
import { addToHistory, getUserHistory, login, register } from "../controllers/users.controler.js";
import { requireAuth } from "../middleware/auth.js";


const router =Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(requireAuth,addToHistory);
router.route("/get_all_activity").get(requireAuth,getUserHistory);

export default router;
