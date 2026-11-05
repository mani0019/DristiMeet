import jwt from "jsonwebtoken";
import httpStatus from "http-status";

export const verifyToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
  }
  req.user = payload;
  next();
};