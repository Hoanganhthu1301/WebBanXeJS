const jwt = require('jsonwebtoken');

const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

if (!privateKey) {
  throw new Error('Thiếu biến môi trường JWT_PRIVATE_KEY');
}

if (!publicKey) {
  throw new Error('Thiếu biến môi trường JWT_PUBLIC_KEY');
}

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });
};

const generateResetToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      type: 'reset-password'
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m'
    }
  );
};

const verifyResetToken = (token) => {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateResetToken,
  verifyResetToken
};