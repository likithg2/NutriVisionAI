import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('\x1b[32m%s\x1b[0m', 'PostgreSQL connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('\x1b[32m%s\x1b[0m', 'PostgreSQL models synced successfully');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'PostgreSQL connection error:', error);
  }
}
