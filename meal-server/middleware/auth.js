import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_hostel_meal_jwt_key_2026_production_safe";

/**
 * Generate a signed JWT token
 * @param {object} payload - { id, email, role, name }
 * @param {string} [expiresIn='7d']
 * @returns {string} Signed JWT
 */
export const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token from Authorization header (Bearer <token>)
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing. Please sign in.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session token has expired. Please sign in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token. Access denied.",
    });
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles ('admin', 'chef', 'student')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(", ")}]. Current role: ${req.user.role}.`,
      });
    }

    return next();
  };
};
