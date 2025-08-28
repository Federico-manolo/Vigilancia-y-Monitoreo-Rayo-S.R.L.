const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
const JWT_EXPIRES_IN = '24h';

const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

const generateToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }
  
  return jwt.verify(token, JWT_SECRET);
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const getRefreshTokenExpiryDate = () => {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);
};

// Helper para setear cookie httpOnly segura
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRES_IN,
    path: '/api/auth/refresh',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: '/api/auth/refresh',
  });
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_TOKEN_EXPIRES_IN,
}; 