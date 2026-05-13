const Database = require('./database');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/chat_app.db');

async function initializeDatabase() {
  try {
    const db = new Database(DB_PATH);
    await db.open();
    await db.initializeSchema();
    console.log('✓ Database initialization completed successfully');
    await db.close();
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
