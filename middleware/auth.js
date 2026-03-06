import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect middleware
 * Verifies the JWT token from the Authorization header.
 * If valid, attaches the user object to req.user and calls next().
 * Used to protect private routes that require authentication.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    // Verify token and decode the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by decoded ID, exclude password from result
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request object for use in downstream route handlers
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

/**
 * admin middleware
 * Must be used AFTER protect middleware.
 * Checks that the authenticated user has the "admin" role.
 * Returns 403 Forbidden if the user is not an admin.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Not authorized as admin" });
  }
};
