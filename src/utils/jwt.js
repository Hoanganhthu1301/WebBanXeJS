const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Thiếu biến môi trường JWT_SECRET");
}

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

const generateResetToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      type: "reset-password",
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
    }
  );
};

const verifyResetToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateResetToken,
  verifyResetToken,
};