const path = require('path');
const Database = require('better-sqlite3');

// Check both possible locations
const paths = [
  path.join(__dirname, 'dev.db'),
  path.join(__dirname, '..', 'dev.db'),
];

for (const dbPath of paths) {
  try {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`DB at ${dbPath}:`, tables.map(t => t.name));
    db.close();
  } catch (e) {
    console.log(`DB at ${dbPath}: ERROR -`, e.message);
  }
}
