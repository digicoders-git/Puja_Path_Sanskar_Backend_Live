const jwt = require("jsonwebtoken");

const Auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided", success: false });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ message: "Not authorized, invalid token", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Standard: req.user
    req.admin = decoded; // Legacy support: req.admin

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed or expired", success: false });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin only.", success: false });
  }
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === "user") {
    return next();
  } else {
    return res.status(403).json({ message: "Access denied. User only.", success: false });
  }
};

module.exports = { Auth, adminOnly, userOnly };