import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Try loading from backend/.env (canonical location per README)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 2. Try loading from repository root .env if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// 3. Fallback to process.cwd() .env
dotenv.config();

// Note: dotenv will never overwrite environment variables already present in process.env
// (e.g. variables provided directly by Render, Vercel, or host platforms).
