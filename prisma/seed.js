const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');

// Direct SQLite approach since Prisma v7 client has complex initialization
const dbPath = path.join(__dirname, 'dev.db');

// Use Prisma through a helper script approach
async function main() {
  // We'll use a simpler approach - write a TypeScript seed that runs via tsx
  const hashedPassword = await bcrypt.hash('admin@123', 12);
  
  // Direct SQL approach using sqlite3
  const sqlite3 = require('better-sqlite3');
  const db = sqlite3(dbPath);
  
  // Insert admin user
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO User (name, username, password, role, active, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  insertUser.run('Super Admin', 'admin', hashedPassword, 'superadmin', 1);
  
  // Insert courses
  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO Course (name, code, duration, durationUnit, fee, description, active, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  
  const courses = [
    ['Basic Computer Course', 'BCC', 3, 'months', 3000, 'MS Office, Internet, Email, Typing'],
    ['Tally Prime with GST', 'TALLY', 3, 'months', 5000, 'Tally Prime, GST, Accounting, Inventory'],
    ['Advanced Excel', 'AEXL', 2, 'months', 4000, 'Advanced Formulas, Pivot Tables, Macros, VBA'],
    ['DCA (Diploma in Computer Application)', 'DCA', 12, 'months', 12000, 'Complete Computer Application Diploma'],
    ['ADCA (Advanced Diploma)', 'ADCA', 18, 'months', 18000, 'Advanced Diploma in Computer Application'],
    ['Web Development', 'WEBDEV', 6, 'months', 15000, 'HTML, CSS, JavaScript, React, Node.js'],
    ['Python Programming', 'PYTHON', 4, 'months', 8000, 'Python basics to advanced with projects'],
    ['Graphic Design', 'GFX', 4, 'months', 8000, 'Photoshop, Illustrator, CorelDRAW'],
  ];
  
  for (const c of courses) {
    insertCourse.run(...c);
  }
  
  // Get courses for batch creation
  const allCourses = db.prepare('SELECT * FROM Course').all();
  
  const insertBatch = db.prepare(`
    INSERT OR IGNORE INTO Batch (name, courseId, startDate, timing, instructor, capacity, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  for (const course of allCourses) {
    insertBatch.run(`${course.code} - Morning Batch`, course.id, '2026-01-01', '10:00 AM - 12:00 PM', 'TBD', 25, 'active');
    insertBatch.run(`${course.code} - Evening Batch`, course.id, '2026-01-01', '4:00 PM - 6:00 PM', 'TBD', 25, 'active');
  }
  
  db.close();
  
  console.log('✅ Database seeded successfully!');
  console.log('📧 Login: admin / admin@123');
}

main().catch(e => { console.error(e); process.exit(1); });
