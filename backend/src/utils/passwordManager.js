const bcrypt = require('bcryptjs');

class PasswordManager {
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = PasswordManager;
