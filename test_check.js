import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./data/easyway.sqlite');
console.log(db.prepare("SELECT * FROM notification_targets WHERE target_type='app'").all());
