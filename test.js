import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./data/easyway.sqlite');
try {
  db.exec(`INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (0, 'System App User', 'system@easyway.app', 'none');`);
  console.log('User 0 inserted');
  console.log(db.prepare('SELECT * FROM users WHERE id=0').get());
} catch(e) {
  console.error(e);
}
