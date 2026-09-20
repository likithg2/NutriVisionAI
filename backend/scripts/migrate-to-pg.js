import sqlite3 from 'sqlite3';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { sequelize } from '../src/config/db.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Postgres connected');
  } catch (err) {
    console.error('PG connect error', err);
    process.exit(1);
  }

  // Load models (they will use the globally exported sequelize in db.js, which we need to override/re-initialize)
  // Actually, wait! The models are defined using `import { sequelize } from '../config/db.js'`.
  // To use PostgreSQL, we should first update `../config/db.js` to point to PostgreSQL, 
  // and THEN run this script, reading from sqlite3 raw.

  // Let's assume db.js has been updated before running this script.
  // We'll import models AFTER updating db.js.
  
  const { default: User } = await import('../src/models/User.js');
  const { default: Item } = await import('../src/models/Item.js');
  const { default: Activity } = await import('../src/models/Activity.js');
  const { default: MealLog } = await import('../src/models/MealLog.js');
  const { default: Notification } = await import('../src/models/Notification.js');

  await sequelize.sync({ alter: true });
  console.log('Postgres synced');

  // Read from SQLite
  const sqliteDbPath = path.resolve(__dirname, '../database.sqlite');
  const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Failed to open SQLite database. If it does not exist or is empty, this is fine.');
      console.error(err);
      process.exit(1);
    }
  });

  const fetchAll = (table) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) resolve([]);
        else reject(err);
      } else {
        resolve(rows);
      }
    });
  });

  try {
    const users = await fetchAll('Users');
    console.log(`Migrating ${users.length} Users...`);
    for (const u of users) {
      // Remove phone if it doesn't exist in sqlite
      if (u.phone === undefined) u.phone = null;
      await User.upsert(u);
    }

    const items = await fetchAll('Items');
    console.log(`Migrating ${items.length} Items...`);
    for (const i of items) await Item.upsert(i);

    const activities = await fetchAll('Activities');
    console.log(`Migrating ${activities.length} Activities...`);
    for (const a of activities) await Activity.upsert(a);

    const logs = await fetchAll('MealLogs');
    console.log(`Migrating ${logs.length} MealLogs...`);
    for (const l of logs) await MealLog.upsert(l);

    const notifications = await fetchAll('Notifications');
    console.log(`Migrating ${notifications.length} Notifications...`);
    for (const n of notifications) await Notification.upsert(n);

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
