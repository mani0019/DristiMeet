import { User } from "../model/user.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../model/meeting.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const JWT_EXPIRY = "7d";

/* ===============================
   LOGIN
================================ */
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide credentials" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    // ✅ JWT instead of crypto token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(httpStatus.OK).json({ token });
  } catch (err) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

/* ===============================
   REGISTER
================================ */
const register = async (req, res) => {
  const { name, username, password } = req.body;
    if (typeof name !== "string" || !name.trim() ||
      typeof username !== "string" || !username.trim() ||
      typeof password !== "string" || password.length < 6) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Name, username and a password of at least 6 characters are required",
    });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
      history: [],
    });

    await newUser.save();
    res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (err) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
};

/* ===============================
   GET HISTORY
================================ */
  const getUserHistory = async (req, res) => {
    try {
      const meetings = await Meeting.find({ user_id: req.user.username }).sort({ date: -1 });
      res.json({ meetings });
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
  };

  const addToHistory = async (req, res) => {
    const { meetingCode } = req.body;
    if (typeof meetingCode !== "string" || !meetingCode.trim()) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: "meetingCode is required" });
    }
    try {
      await Meeting.create({ user_id: req.user.username, meetingCode: meetingCode.trim() });
      res.status(httpStatus.CREATED).json({ message: "Meeting added" });
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
    }
  };

export { login, register, getUserHistory, addToHistory };