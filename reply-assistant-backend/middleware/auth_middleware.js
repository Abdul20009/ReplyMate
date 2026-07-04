const jwt = require("jsonwebtoken");

// ─── Protect routes: verify JWT before allowing access ───────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }

  // 2. Verify token
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

module.exports = protect;