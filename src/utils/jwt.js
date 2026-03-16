const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const privateKey = fs.readFileSync(
  path.join(__dirname, '../../keys/private.key'),
  'utf8'
);

const publicKey = fs.readFileSync(
  path.join(__dirname, '../../keys/public.key'),
  'utf8'
);

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