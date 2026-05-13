const jwt = require('jwt-simple');
const dotenv = require('dotenv');

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_secret_key';
const EXPIRY = process.env.JWT_EXPIRY || '7d';

// Convert expiry format to milliseconds
function getExpiryMs() {
  const match = EXPIRY.match(/^(\d+)(d|h|m|s)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

  const [, amount, unit] = match;
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return parseInt(amount) * multipliers[unit];
}

class TokenManager {
  static generateToken(payload) {
    const expiry = Math.floor(Date.now() / 1000) + Math.floor(getExpiryMs() / 1000);
    return jwt.encode({ ...payload, exp: expiry }, SECRET);
  }

  static verifyToken(token) {
    try {
      const decoded = jwt.decode(token, SECRET, true);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token, SECRET, true);
      return decoded.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
}

module.exports = TokenManager;
