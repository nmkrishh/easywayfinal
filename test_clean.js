import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('./data/easyway.sqlite');
console.log(db.prepare("SELECT * FROM notification_targets WHERE target_type='app'").all());
db.exec("DELETE FROM notification_targets WHERE endpoint='test_token'");
console.log('Cleaned test_token');
